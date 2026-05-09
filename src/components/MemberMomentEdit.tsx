import React, { useState } from 'react';
import { useMemberMoments, MemberMoment } from '@/hooks/useMemberMoments';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MemberMomentEditProps {
  moment: MemberMoment;
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

const MemberMomentEdit: React.FC<MemberMomentEditProps> = ({ moment, onClose, isOpen = true }) => {
  const [tagline, setTagline] = useState(moment.tagline);
  const [dateTaken, setDateTaken] = useState(format(new Date(moment.date_taken), 'yyyy-MM-dd'));
  const [selectedTags, setSelectedTags] = useState<string[]>(moment.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [updating, setUpdating] = useState(false);

  const { updateMoment } = useMemberMoments();
  const { toast } = useToast();

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

  const handleUpdate = async () => {
    if (!tagline.trim()) {
      toast({ title: 'Missing line', description: 'Add a few words.', variant: 'destructive' });
      return;
    }
    setUpdating(true);
    try {
      await updateMoment(moment.id, tagline.trim(), dateTaken, selectedTags);
      onClose?.();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.message || 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-black border border-white/15 text-white">
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div>
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-2">Edit</p>
            <h2 className="font-display uppercase text-2xl tracking-tight leading-none">Your Moment</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs tracking-[0.3em] uppercase text-white/60 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          <img src={moment.image_url} alt={moment.tagline} className="w-full h-48 object-cover" />

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
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 border border-white/40 font-mono text-xs tracking-[0.4em] uppercase text-white hover:bg-white hover:text-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={!tagline.trim() || updating}
              className="flex-1 h-12 border border-white bg-white text-black font-mono text-xs tracking-[0.4em] uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {updating ? 'Saving' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberMomentEdit;
