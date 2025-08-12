
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
  borderless?: boolean;
}

const LoyaltyBox: React.FC<LoyaltyBoxProps> = ({ index, filled, disabled, imageUrl, onSelectFile, variant = 'default', borderless }) => {
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
        "relative aspect-square rounded-md bg-background/60 flex items-center justify-center overflow-hidden",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer transition-colors",
        !borderless && (variant === 'lucky' ? "border border-accent/60 hover:border-accent" : "border border-border hover:border-foreground/60")
      )}
      onClick={handleClick}
      >
      {imageUrl ? (
        <img src={imageUrl} alt={`Box ${index}`} className="w-full h-full object-cover" />
      ) : filled ? (
        <Check className="w-6 h-6 text-foreground" />
      ) : (
        <div className="flex flex-col items-center justify-center text-foreground/70 p-1">
          <Camera className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Box {index}</span>
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
