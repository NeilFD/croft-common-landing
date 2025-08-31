import React, { useState } from 'react';
import { Menu, X, Home, LogOut, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MobileNavigationMenuProps {
  slideLabels: string[];
  currentSlide: number;
  onSlideSelect: (index: number) => void;
  onLogout: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  className?: string;
}

export function MobileNavigationMenu({
  slideLabels,
  currentSlide,
  onSlideSelect,
  onLogout,
  isMuted,
  onToggleMute,
  className
}: MobileNavigationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSlideSelect = (index: number) => {
    onSlideSelect(index);
    setIsOpen(false);
  };

  return (
    <div className={cn("fixed top-4 left-4 z-50 md:hidden", className)}>
      <div className="flex items-center gap-2">
        {/* Main Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white",
            "min-w-[44px] min-h-[44px] rounded-full",
            "touch-manipulation"
          )}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Audio Control */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMute}
          className={cn(
            "bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white",
            "min-w-[44px] min-h-[44px] rounded-full",
            "touch-manipulation"
          )}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className={cn(
            "bg-black/80 backdrop-blur-sm hover:bg-black/90 text-white",
            "min-w-[44px] min-h-[44px] rounded-full",
            "touch-manipulation"
          )}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Slide Navigation Menu */}
      {isOpen && (
        <div className="absolute top-14 left-0 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[200px] max-h-[60vh] overflow-y-auto">
          <div className="space-y-1">
            {slideLabels.map((label, index) => (
              <button
                key={index}
                onClick={() => handleSlideSelect(index)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                  "touch-manipulation min-h-[44px] flex items-center",
                  currentSlide === index
                    ? "bg-white/20 text-white font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}