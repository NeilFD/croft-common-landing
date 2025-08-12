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
    <div className={cn('flex items-center gap-2', className)}>
      <ArrowBox
        direction="left"
        icon={<ArrowDownLeft className="size-5" />}
        onClick={onDownLeft}
        ariaLabel={ariaLabels?.downLeft || 'Down left'}
        contrast={contrast}
      />
      <ArrowBox
        direction="right"
        icon={<ArrowDown className="size-5" />}
        onClick={onDown}
        ariaLabel={ariaLabels?.down || 'Down'}
        contrast={contrast}
      />
    </div>
  )
}

export default GuideArrows
