import * as React from 'react'
import { ArrowDownLeft, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ArrowBox } from './ArrowBox'

export type GuideArrowsProps = {
  onDownLeft?: () => void
  onDown?: () => void
  contrast?: 'neutral' | 'contrast'
  className?: string
  ariaLabels?: { downLeft?: string; down?: string }
}

export function GuideArrows({ onDownLeft, onDown, contrast = 'neutral', className, ariaLabels }: GuideArrowsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <ArrowBox
        direction="left"
        size="sm"
        icon={<ArrowDownLeft className="size-4" />}
        onClick={onDownLeft}
        ariaLabel={ariaLabels?.downLeft || 'Down left'}
        contrast={contrast}
      />
      <ArrowBox
        direction="right"
        size="sm"
        icon={<ArrowDown className="size-4" />}
        onClick={onDown}
        ariaLabel={ariaLabels?.down || 'Down'}
        contrast={contrast}
      />
    </div>
  )
}

export default GuideArrows
