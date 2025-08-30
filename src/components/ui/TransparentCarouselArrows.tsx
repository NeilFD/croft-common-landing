import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransparentCarouselArrowProps {
  direction: 'left' | 'right';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function TransparentCarouselArrow({ 
  direction, 
  onClick, 
  disabled = false, 
  className 
}: TransparentCarouselArrowProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles - transparent with just the icon
        "absolute z-10 transition-all duration-300",
        "flex items-center justify-center",
        "text-white/80 hover:text-[hsl(var(--accent-pink))]",
        "disabled:text-white/30 disabled:cursor-not-allowed",
        "focus:outline-none focus:text-[hsl(var(--accent-pink))]",
        // Positioning
        direction === 'left' 
          ? "left-4 top-1/2 -translate-y-1/2" 
          : "right-4 top-1/2 -translate-y-1/2",
        // Hover effects
        "hover:scale-110 hover:drop-shadow-lg",
        "active:scale-95",
        className
      )}
      style={{
        filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
      }}
    >
      <Icon 
        className={cn(
          "w-8 h-8 transition-all duration-300",
          "hover:w-9 hover:h-9"
        )} 
      />
    </button>
  );
}

interface TransparentCarouselArrowsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  canScrollPrev?: boolean;
  canScrollNext?: boolean;
  className?: string;
}

export function TransparentCarouselArrows({
  onPrevious,
  onNext,
  canScrollPrev = true,
  canScrollNext = true,
  className
}: TransparentCarouselArrowsProps) {
  return (
    <div className={cn("relative", className)}>
      <TransparentCarouselArrow
        direction="left"
        onClick={onPrevious}
        disabled={!canScrollPrev}
      />
      <TransparentCarouselArrow
        direction="right"
        onClick={onNext}
        disabled={!canScrollNext}
      />
    </div>
  );
}