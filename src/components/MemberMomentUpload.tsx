import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMemberMoments } from '@/hooks/useMemberMoments';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MemberMomentUploadProps {
  onClose?: () => void;
  isOpen?: boolean;
}

const PRESET_TAGS = [
  'Town', 'Country', 'Bar', 'Restaurant', 'Garden', 'Pool',
  'Rooms', 'Late', 'Cinema', 'Music', 'Crew',
];

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

type Stage = 'idle' | 'checking' | 'saving' | 'done';

const STAGE_LABEL: Record<Stage, string> = {
  idle: 'Post Moment',
  checking: 'Checking photo',
  saving: 'Saving',
  done: 'Done',
};

const STAGE_PCT: Record<Stage, number> = {
  idle: 0,
  checking: 35,
  saving: 80,
  done: 100,
};

const MemberMomentUpload: React.FC<MemberMomentUploadProps> = ({ onClose, isOpen = true }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [tagline, setTagline] = useState('');
  const [dateTaken, setDateTaken] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  const [stage, setStage] = useState<Stage>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMoment, refetchMoments } = useMemberMoments();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast({ title: 'Wrong file type', description: 'Pick an image.', variant: 'destructive' });
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ title: 'Too big', description: 'Max 10MB.', variant: 'destructive' });
      return;
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
      toast({ title: 'Missing details', description: 'Add a photo and a line.', variant: 'destructive' });
      return;
    }

    setStage('checking');

    // Run AI moderation and base64 conversion in parallel with no extra round-trips
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

    try {
      setStage('saving');
      const result = await uploadMoment(file, tagline.trim(), dateTaken, selectedTags);
      if (!result) throw new Error('Could not save your moment.');
      setStage('done');
      refetchMoments();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                <p className="font-display uppercase text-xl tracking-tight mb-2">Pick a photo</p>
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                  JPG · PNG · GIF · 10MB Max
                </p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="font-sans text-xs text-white/50 leading-relaxed">
                Photos are checked automatically. Anything inappropriate is rejected.
              </p>
            </>
          )}

          {step === 'details' && (
            <>
              {previewUrl && (
                <div className="relative">
                  <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
                  <button
                    type="button"
                    onClick={handleBack}
                    className="absolute top-2 left-2 px-3 h-8 bg-black/80 border border-white/40 font-mono text-[10px] tracking-[0.3em] uppercase text-white hover:bg-white hover:text-black transition-colors"
                  >
                    Change
                  </button>
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

              <button
                onClick={handleUpload}
                disabled={!tagline.trim() || busy}
                className="w-full h-12 border border-white bg-white text-black font-mono text-xs tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                {checking ? 'Checking' : uploading ? 'Posting' : 'Post Moment'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberMomentUpload;
