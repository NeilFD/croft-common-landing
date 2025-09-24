import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
}

export const StarRating = ({ label, value, onChange, className }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleStarClick = (starValue: number) => {
    // If clicking the same star that's already selected, clear the rating
    if (value === starValue) {
      onChange(null);
    } else {
      onChange(starValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = (hoverValue || value || 0) >= star;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className={cn(
                "transition-colors duration-150 hover:scale-110 transform",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded",
                "p-1"
              )}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''} for ${label}`}
            >
              <Star
                size={20}
                className={cn(
                  "transition-colors duration-150",
                  isActive 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-muted-foreground hover:text-yellow-300"
                )}
              />
            </button>
          );
        })}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Clear ${label} rating`}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};