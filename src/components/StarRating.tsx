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

  const starHeaders = {
    1: "Not the one",
    3: "Common", 
    5: "Uncommon"
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {/* Headers above specific stars */}
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="flex-1 text-center">
              {starHeaders[star as keyof typeof starHeaders] && (
                <span className="text-xs text-muted-foreground font-medium">
                  {starHeaders[star as keyof typeof starHeaders]}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Stars spread across full width */}
        <div className="flex justify-between items-center">
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
                  "p-2 rounded"
                )}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''} for ${label}`}
              >
                <Star
                  size={24}
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
        </div>
        
        {value && (
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Clear ${label} rating`}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};