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
      <div className="flex items-center gap-4 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canScrollPrev}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            "bg-white/10 hover:bg-white/20 active:bg-white/30",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          )}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Slide Counter */}
        <div className="text-white text-sm font-medium px-2 min-w-[50px] text-center">
          {currentSlide + 1} / {totalSlides}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!canScrollNext}
          className={cn(
            "p-2 rounded-full transition-all duration-200",
            "bg-white/10 hover:bg-white/20 active:bg-white/30",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          )}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}