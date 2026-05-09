/**
 * Client-side video compression using MediaRecorder + canvas capture.
 *
 * Re-encodes a video to a max 720p frame (preserving aspect ratio) at ~2 Mbps,
 * keeping the original audio. Works in modern Chrome, Edge, Firefox, Safari 14.1+.
 *
 * Falls back to returning the original file when:
 *   - the browser lacks the required APIs
 *   - the source is already small/short
 *   - compression fails or produces a larger file
 */

const MAX_DIMENSION = 1280; // 720p-equivalent on the long edge
const TARGET_VIDEO_BITRATE = 2_000_000; // ~2 Mbps
const TARGET_AUDIO_BITRATE = 96_000; // 96 kbps
const SKIP_IF_SMALLER_THAN = 8 * 1024 * 1024; // 8MB — not worth re-encoding

export interface CompressOptions {
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}

export interface CompressResult {
  file: File;
  compressed: boolean;
  originalBytes: number;
  outputBytes: number;
}

const pickMimeType = (): string | null => {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      // ignore
    }
  }
  return null;
};

const extensionFor = (mime: string): string => {
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  return 'bin';
};

export async function compressVideo(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { onProgress, signal } = options;
  const originalBytes = file.size;

  const fail = (): CompressResult => ({
    file,
    compressed: false,
    originalBytes,
    outputBytes: originalBytes,
  });

  if (!file.type.startsWith('video/')) return fail();
  if (originalBytes < SKIP_IF_SMALLER_THAN) return fail();

  const mimeType = pickMimeType();
  if (!mimeType) return fail();

  // Canvas captureStream + MediaRecorder feature check
  const canvasProto = HTMLCanvasElement.prototype as unknown as {
    captureStream?: () => MediaStream;
  };
  if (typeof canvasProto.captureStream !== 'function') return fail();

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true; // required for autoplay during processing
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';

  const cleanup = () => {
    try { video.pause(); } catch { /* ignore */ }
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => { video.removeEventListener('error', onErr); resolve(); };
      const onErr = () => { video.removeEventListener('loadedmetadata', onLoaded); reject(new Error('metadata')); };
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onErr, { once: true });
    });

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const duration = video.duration;
    if (!srcW || !srcH || !isFinite(duration) || duration <= 0) {
      cleanup();
      return fail();
    }

    const longEdge = Math.max(srcW, srcH);
    const scale = longEdge > MAX_DIMENSION ? MAX_DIMENSION / longEdge : 1;
    // Round to even numbers (encoders prefer it)
    const dstW = Math.max(2, Math.floor((srcW * scale) / 2) * 2);
    const dstH = Math.max(2, Math.floor((srcH * scale) / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { cleanup(); return fail(); }

    // Build the output stream: video from canvas + audio from the source video
    const captureFn = (canvas as unknown as { captureStream: (fps?: number) => MediaStream }).captureStream;
    const videoStream = captureFn.call(canvas, 30);

    let combined: MediaStream = videoStream;
    try {
      const elWithCapture = video as unknown as {
        captureStream?: () => MediaStream;
        mozCaptureStream?: () => MediaStream;
      };
      const sourceStream = elWithCapture.captureStream?.() ?? elWithCapture.mozCaptureStream?.();
      const audioTrack = sourceStream?.getAudioTracks?.()[0];
      if (audioTrack) {
        combined = new MediaStream([
          ...videoStream.getVideoTracks(),
          audioTrack,
        ]);
      }
    } catch {
      // continue without audio if it can't be captured
    }

    const recorder = new MediaRecorder(combined, {
      mimeType,
      videoBitsPerSecond: TARGET_VIDEO_BITRATE,
      audioBitsPerSecond: TARGET_AUDIO_BITRATE,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };

    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = (ev: Event) => reject((ev as unknown as { error?: Error }).error ?? new Error('recorder'));
    });

    let raf = 0;
    const drawLoop = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, dstW, dstH);
      if (duration > 0) {
        const pct = Math.min(99, Math.round((video.currentTime / duration) * 100));
        onProgress?.(pct);
      }
      raf = requestAnimationFrame(drawLoop);
    };

    const abortHandler = () => {
      try { recorder.stop(); } catch { /* ignore */ }
    };
    signal?.addEventListener('abort', abortHandler);

    recorder.start(250);

    video.currentTime = 0;
    await video.play();
    raf = requestAnimationFrame(drawLoop);

    await new Promise<void>((resolve, reject) => {
      video.addEventListener('ended', () => resolve(), { once: true });
      video.addEventListener('error', () => reject(new Error('playback')), { once: true });
    });

    cancelAnimationFrame(raf);
    // Draw one final frame to flush
    try { ctx.drawImage(video, 0, 0, dstW, dstH); } catch { /* ignore */ }
    recorder.stop();
    await stopped;
    signal?.removeEventListener('abort', abortHandler);

    const outBlob = new Blob(chunks, { type: mimeType });
    cleanup();

    if (outBlob.size === 0 || outBlob.size >= originalBytes) {
      return fail();
    }

    const ext = extensionFor(mimeType);
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'video';
    const outFile = new File([outBlob], `${baseName}.${ext}`, {
      type: mimeType.split(';')[0],
      lastModified: Date.now(),
    });

    onProgress?.(100);
    return {
      file: outFile,
      compressed: true,
      originalBytes,
      outputBytes: outBlob.size,
    };
  } catch {
    cleanup();
    return fail();
  }
}
