import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ArrowBoxProps = {
  direction: 'left' | 'right'
  onClick?: () => void
  ariaLabel?: string
  contrast?: 'neutral' | 'contrast'
  className?: string
}

export function ArrowBox({ direction, onClick, ariaLabel, contrast = 'contrast', className }: ArrowBoxProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel || (direction === 'left' ? 'Previous' : 'Next')}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center size-11 rounded-md border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-pink))] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        contrast === 'contrast'
          ? 'border-background text-background hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]'
          : 'border-foreground text-foreground hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))] bg-transparent',
        className,
      )}
    >
      {direction === 'left' ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  )
}
