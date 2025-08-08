
import React from 'react';
import { Camera, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoyaltyBoxProps {
  index: number;
  filled: boolean;
  disabled?: boolean;
  imageUrl?: string;
  onSelectFile: (file: File) => void;
  variant?: 'default' | 'lucky';
}

const LoyaltyBox: React.FC<LoyaltyBoxProps> = ({ index, filled, disabled, imageUrl, onSelectFile, variant = 'default' }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelectFile(file);
    // Reset value so the same file can be reselected if needed
    e.currentTarget.value = '';
  };

  return (
    <div
      className={cn(
        "relative aspect-square rounded-md border bg-background/60 flex items-center justify-center overflow-hidden",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer transition-colors",
        variant === 'lucky' ? "border-accent/60 hover:border-accent" : "border-steel/40 hover:border-foreground/60"
      )}
      onClick={handleClick}
      >
      {imageUrl ? (
        <img src={imageUrl} alt={`Box ${index}`} className="w-full h-full object-cover" />
      ) : filled ? (
        <Check className="w-6 h-6 text-foreground" />
      ) : (
        <div className="flex flex-col items-center justify-center text-foreground/70">
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-xs">Box {index}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default LoyaltyBox;
