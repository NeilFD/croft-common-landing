import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { compressVideo } from '@/lib/compressVideo';
import type { MemberMoment } from '@/hooks/useMemberMoments';

interface MemberMomentUploadProps {
  onClose?: () => void;
  isOpen?: boolean;
  onPosted?: () => void;
  uploadMoment: (
    file: File,
    tagline: string,
    dateTaken: string,
    tags?: string[],
    extras?: {
      mediaType?: 'image' | 'video';
      posterBlob?: Blob | null;
      durationSeconds?: number | null;
      onProgress?: (pct: number) => void;
    },
  ) => Promise<MemberMoment | undefined>;
}

const PRESET_TAGS = [
  'Town', 'Country', 'Bar', 'Restaurant', 'Garden', 'Pool',
  'Rooms', 'Late', 'Cinema', 'Music', 'Crew',
];

const MAX_VIDEO_SECONDS = 30;
const MAX_BYTES = 500 * 1024 * 1024; // 500MB cap (high-bitrate 30s videos)
const MAX_RAW_VIDEO_BYTES = 18 * 1024 * 1024; // raw phone video is too heavy for feed playback

const chipBase =
  'inline-flex items-center justify-center px-3 h-7 font-mono text-[10px] tracking-[0.3em] uppercase border transition-colors';
const chipUnselected = `${chipBase} border-white/40 text-white hover:bg-white hover:text-black`;
const chipSelected = `${chipBase} bg-white text-black border-white`;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface VideoMeta {
  durationSeconds: number;
  posterBlob: Blob | null;
}

const probeVideo = (file: File): Promise<VideoMeta> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadedmetadata = () => {
      const duration = video.duration;
      // Seek to 0.1s for poster
      video.currentTime = Math.min(0.1, duration / 2);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve({ durationSeconds: video.duration, posterBlob: null });
          return;
        }
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve({ durationSeconds: video.duration, posterBlob: blob });
          },
          'image/jpeg',
          0.85,
        );
      } catch {
        URL.revokeObjectURL(url);
        resolve({ durationSeconds: video.duration, posterBlob: null });
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata.'));
    };
  });

type Stage = 'idle' | 'checking' | 'compressing' | 'saving' | 'done';

const STAGE_LABEL: Record<Stage, string> = {
  idle: 'Post Moment',
  checking: 'Checking',
  compressing: 'Compressing',
  saving: 'Saving',
  done: 'Done',
};

const STAGE_PCT: Record<Stage, number> = {
  idle: 0,
  checking: 10,
  compressing: 20,
  saving: 50,
  done: 100,
};

const MemberMomentUpload: React.FC<MemberMomentUploadProps> = ({ onClose, isOpen = true, onPosted, uploadMoment }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [tagline, setTagline] = useState('');
  const [dateTaken, setDateTaken] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  const [stage, setStage] = useState<Stage>('idle');
  const [uploadPct, setUploadPct] = useState(0);
  const [compressPct, setCompressPct] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const isVideo = selectedFile.type.startsWith('video/');
    const isImage = selectedFile.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast({ title: 'Wrong file type', description: 'Pick a photo or short video.', variant: 'destructive' });
      return;
    }
    if (selectedFile.size > MAX_BYTES) {
      toast({ title: 'Too big', description: 'Max 500MB.', variant: 'destructive' });
      return;
    }

    if (isVideo) {
      try {
        const meta = await probeVideo(selectedFile);
        if (meta.durationSeconds > MAX_VIDEO_SECONDS + 0.5) {
          toast({
            title: 'Too long',
            description: `Videos must be ${MAX_VIDEO_SECONDS} seconds or less.`,
            variant: 'destructive',
          });
          return;
        }
        setVideoMeta(meta);
        setMediaType('video');
      } catch {
        toast({ title: 'Bad video', description: 'Could not read that video.', variant: 'destructive' });
        return;
      }
    } else {
      setMediaType('image');
      setVideoMeta(null);
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setStep('details');
  };

  const togglePresetTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setCustomTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!file || !tagline.trim()) {
      toast({ title: 'Missing details', description: 'Add a clip and a line.', variant: 'destructive' });
      return;
    }

    setStage('checking');

    // AI moderation runs only for images. Videos skip AI check in v1.
    if (mediaType === 'image') {
      let moderation: { allowed: boolean; reason?: string };
      try {
        const imageBase64 = await fileToBase64(file);
        const { data, error } = await supabase.functions.invoke('moderate-moment-upload', {
          body: { imageBase64, mimeType: file.type },
        });
        if (error) throw new Error(error.message || 'Photo check failed.');
        moderation = data as { allowed: boolean; reason?: string };
      } catch (err: any) {
        setStage('idle');
        toast({
          title: 'Photo check failed',
          description: err?.message || 'Try again in a moment.',
          variant: 'destructive',
        });
        return;
      }

      if (!moderation?.allowed) {
        setStage('idle');
        toast({
          title: 'Photo blocked',
          description: moderation?.reason || "This photo can't be posted.",
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      let uploadFile = file;
      let uploadPosterBlob = videoMeta?.posterBlob ?? null;
      let uploadDuration = videoMeta?.durationSeconds ?? null;

      if (mediaType === 'video') {
        setStage('compressing');
        setCompressPct(0);
        try {
          const result = await compressVideo(file, {
            onProgress: (pct) => setCompressPct(pct),
          });
          if (result.compressed) {
            uploadFile = result.file;
            // Re-probe to refresh poster/duration from compressed output
            try {
              const meta = await probeVideo(result.file);
              uploadPosterBlob = meta.posterBlob ?? uploadPosterBlob;
              uploadDuration = meta.durationSeconds ?? uploadDuration;
            } catch {
              // keep original poster/duration
            }
          }
        } catch {
          // fall through with original file
        }
      }

      setStage('saving');
      setUploadPct(0);
      const result = await uploadMoment(uploadFile, tagline.trim(), dateTaken, selectedTags, {
        mediaType,
        posterBlob: uploadPosterBlob,
        durationSeconds: uploadDuration,
        onProgress: (pct) => setUploadPct(pct),
      });
      if (!result) throw new Error('Could not save your moment.');
      setStage('done');
      onPosted?.();
      toast({ title: 'Posted', description: 'Your moment is up.' });
      setTimeout(() => {
        handleReset();
        onClose?.();
      }, 350);
    } catch (error: any) {
      setStage('idle');
      toast({
        title: 'Upload failed',
        description: error?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setMediaType('image');
    setVideoMeta(null);
    setTagline('');
    setDateTaken(format(new Date(), 'yyyy-MM-dd'));
    setSelectedTags([]);
    setCustomTag('');
    setStep('upload');
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('upload');
      handleReset();
    }
  };

  if (!isOpen) return null;

  const busy = stage !== 'idle';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-black border border-white/15 text-white">
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div>
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-2">
              Share
            </p>
            <h2 className="font-display uppercase text-2xl tracking-tight leading-none">
              A Moment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs tracking-[0.3em] uppercase text-white/60 hover:text-white"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'upload' && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-white/30 p-10 text-center hover:border-white transition-colors"
              >
                <p className="font-display uppercase text-xl tracking-tight mb-2">Pick a photo or video</p>
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                  JPG · PNG · GIF · MP4 · MOV · 30s max
                </p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="font-sans text-xs text-white/50 leading-relaxed">
                Photos are checked automatically. Videos are capped at 30 seconds.
              </p>
            </>
          )}

          {step === 'details' && (
            <>
              {previewUrl && (
                <div className="relative">
                  {mediaType === 'video' ? (
                    <video
                      src={previewUrl}
                      className="w-full h-56 object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={handleBack}
                    className="absolute top-2 left-2 px-3 h-8 bg-black/80 border border-white/40 font-mono text-[10px] tracking-[0.3em] uppercase text-white hover:bg-white hover:text-black transition-colors"
                  >
                    Change
                  </button>
                  {mediaType === 'video' && videoMeta && (
                    <div className="absolute bottom-2 right-2 px-2 h-6 inline-flex items-center bg-black/70 border border-white/40 font-mono text-[10px] tracking-wider text-white">
                      {Math.round(videoMeta.durationSeconds)}s
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="tagline" className="block font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                  Tell Us
                </label>
                <textarea
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="What's happening?"
                  className="w-full bg-transparent border border-white/20 p-3 font-sans text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white resize-none"
                />
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/40">
                  {tagline.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="date" className="block font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                  When
                </label>
                <input
                  id="date"
                  type="date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full bg-transparent border border-white/20 p-3 font-mono text-xs uppercase tracking-wider text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-3">
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => togglePresetTag(tag)}
                      className={selectedTags.includes(tag) ? chipSelected : chipUnselected}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    placeholder="Add your own"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                    className="flex-1 bg-transparent border border-white/20 px-3 h-9 font-sans text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={!customTag.trim()}
                    className="px-4 h-9 border border-white/40 font-mono text-[10px] tracking-[0.3em] uppercase text-white hover:bg-white hover:text-black transition-colors disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 h-7 bg-white text-black font-mono text-[10px] tracking-[0.3em] uppercase"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-black/60 hover:text-black"
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {busy && (() => {
                let livePct = STAGE_PCT[stage];
                let label: string = STAGE_LABEL[stage];
                if (stage === 'compressing') {
                  const span = STAGE_PCT.saving - STAGE_PCT.compressing;
                  livePct = Math.round(STAGE_PCT.compressing + (compressPct * span) / 100);
                  label = compressPct > 0 ? `Compressing ${compressPct}%` : 'Compressing';
                } else if (stage === 'saving') {
                  const span = 95 - STAGE_PCT.saving;
                  livePct = Math.max(STAGE_PCT.saving, Math.round(STAGE_PCT.saving + (uploadPct * span) / 100));
                  label =
                    uploadPct > 0 && uploadPct < 100
                      ? `Uploading ${uploadPct}%`
                      : uploadPct >= 100
                      ? 'Finalising'
                      : STAGE_LABEL[stage];
                }
                return (
                  <div className="space-y-2">
                    <div className="h-1 w-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-200 ease-out"
                        style={{ width: `${livePct}%` }}
                      />
                    </div>
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                      {label}
                    </p>
                  </div>
                );
              })()}

              <button
                onClick={handleUpload}
                disabled={!tagline.trim() || busy}
                className="w-full h-12 border border-white bg-white text-black font-mono text-xs tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                {STAGE_LABEL[stage]}
              </button>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberMomentUpload;
