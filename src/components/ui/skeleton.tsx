import type * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
}

export function Skeleton({ className, as: Component = 'div', ...props }: SkeletonProps) {
  return (
    <Component className={cn('animate-pulse rounded-md bg-slate-700/40', className)} {...props} />
  )
}
