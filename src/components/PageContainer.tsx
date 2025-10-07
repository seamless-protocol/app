import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * When true (default), applies horizontal padding matching the top nav.
   * Set to false when the parent already provides the horizontal gutters.
   */
  padded?: boolean
}

export function PageContainer({ children, className, padded = true, ...rest }: PageContainerProps) {
  return (
    <div
      className={cn('max-w-7xl mx-auto', padded ? 'px-3 sm:px-4 lg:px-8' : 'px-0', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
