import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileCarouselControlsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  canScrollPrev?: boolean;
  canScrollNext?: boolean;
  currentSlide: number;
  totalSlides: number;
}

export function MobileCarouselControls({
  onPrevious,
  onNext,
  canScrollPrev = true,
  canScrollNext = true,
  currentSlide,
  totalSlides
}: MobileCarouselControlsProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
      <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canScrollPrev}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            "bg-white/5 hover:bg-white/10 active:bg-white/15",
            "disabled:opacity-20 disabled:cursor-not-allowed",
            "touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
          )}
        >
          <ChevronLeft className="w-4 h-4 text-white/80" />
        </button>

        {/* Slide Counter */}
        <div className="text-white/70 text-xs font-medium px-1 min-w-[40px] text-center">
          {currentSlide + 1} / {totalSlides}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!canScrollNext}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            "bg-white/5 hover:bg-white/10 active:bg-white/15",
            "disabled:opacity-20 disabled:cursor-not-allowed",
            "touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center"
          )}
        >
          <ChevronRight className="w-4 h-4 text-white/80" />
        </button>
      </div>
    </div>
  );
}