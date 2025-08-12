import * as React from 'react'
import { cn } from '@/lib/utils'

export type FramedBoxProps<C extends React.ElementType = 'div'> = {
  as?: C
  shape?: 'square' | 'pill'
  contrast?: 'neutral' | 'contrast'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentPropsWithoutRef<C>, 'as' | 'className' | 'children'>

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2 text-base',
}

export function FramedBox<C extends React.ElementType = 'div'>(props: FramedBoxProps<C>) {
  const {
    as,
    shape = 'square',
    contrast = 'neutral',
    size = 'md',
    className,
    children,
    ...rest
  } = props as FramedBoxProps

  const Comp = (as || 'div') as React.ElementType

  return (
    <Comp
      className={cn(
        'inline-block border-2 transition-colors duration-200',
        contrast === 'contrast'
          ? 'border-background text-background hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]'
          : 'border-foreground text-foreground hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))] bg-transparent',
        shape === 'pill' ? 'rounded-full' : 'rounded-md',
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  )
}
