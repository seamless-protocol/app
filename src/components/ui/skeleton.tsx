import type * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  variant?: 'pulse' | 'shimmer'
}

export function Skeleton({
  className,
  as: Component = 'div',
  variant = 'pulse',
  ...props
}: SkeletonProps) {
  const variantClass = variant === 'shimmer' ? 'skeleton--shimmer' : 'animate-pulse'
  return (
    <Component
      className={cn('rounded-sm bg-[var(--skeleton-base)]', variantClass, className)}
      {...props}
    />
  )
}
