import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyledNavigationDropdownProps {
  currentSlide: number;
  labels: string[];
  onSlideSelect: (index: number) => void;
  className?: string;
}

export function StyledNavigationDropdown({ 
  currentSlide, 
  labels, 
  onSlideSelect, 
  className 
}: StyledNavigationDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "group relative bg-background/95 backdrop-blur-sm border-2 border-foreground/20",
            "hover:bg-[hsl(var(--accent-pink))] hover:border-[hsl(var(--accent-pink))]",
            "hover:text-background transition-all duration-300",
            "font-brutalist tracking-wider text-xs px-6 py-3 h-auto",
            "shadow-lg hover:shadow-xl hover:shadow-[hsl(var(--accent-pink))]/20",
            className
          )}
        >
          <span className="flex items-center gap-2 select-none">
            {labels[currentSlide] || `Slide ${currentSlide + 1}`}
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className={cn(
          "w-64 bg-background/95 backdrop-blur-md border-2 border-foreground/20",
          "shadow-2xl shadow-[hsl(var(--accent-pink))]/10",
          "rounded-lg p-2 mt-2 z-50"
        )}
        align="center"
        sideOffset={8}
      >
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {labels.map((label, index) => (
            <DropdownMenuItem
              key={index}
              className={cn(
                "relative px-4 py-3 rounded-md cursor-pointer transition-all duration-200",
                "font-brutalist tracking-wide text-xs text-foreground/80",
                "hover:bg-[hsl(var(--accent-pink))]/10 hover:text-[hsl(var(--accent-pink))]",
                "focus:bg-[hsl(var(--accent-pink))]/10 focus:text-[hsl(var(--accent-pink))]",
                index === currentSlide && "bg-[hsl(var(--accent-pink))]/20 text-[hsl(var(--accent-pink))] font-medium",
                "data-[highlighted]:bg-[hsl(var(--accent-pink))]/10 data-[highlighted]:text-[hsl(var(--accent-pink))]"
              )}
              onClick={() => onSlideSelect(index)}
            >
              <div className="flex items-center justify-between w-full">
                <span>{label}</span>
                {index === currentSlide && (
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--accent-pink))] animate-pulse" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Custom scrollbar styles (add to index.css if not present)
const scrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--accent-pink));
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--accent-pink));
  opacity: 0.8;
}
`;