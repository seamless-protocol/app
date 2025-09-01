'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils/cn'
import { Button } from './button'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  isActive?: boolean
}

interface BreadcrumbProps {
  items: Array<BreadcrumbItem>
  onBack?: () => void
  className?: string
  showBackButton?: boolean
  animated?: boolean
  variant?: 'default' | 'strategy'
}

export function Breadcrumb({
  items,
  onBack,
  className = '',
  showBackButton = true,
  animated = true,
  variant = 'strategy',
}: BreadcrumbProps) {
  const containerClasses = cn('flex items-center space-x-4 mb-6', className)

  const breadcrumbClasses = cn('flex-1', variant === 'strategy' && 'text-slate-400')

  const activeItemClasses = cn(
    'font-medium',
    variant === 'strategy' ? 'text-white' : 'text-foreground',
  )

  const linkClasses = cn(
    'transition-colors font-medium cursor-pointer',
    variant === 'strategy'
      ? 'text-slate-400 hover:text-purple-400'
      : 'text-muted-foreground hover:text-foreground',
  )

  const separatorClasses = cn(
    'h-4 w-4',
    variant === 'strategy' ? 'text-slate-600' : 'text-muted-foreground',
  )

  const Container = animated ? motion.div : 'div'
  const containerProps = animated
    ? {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {}

  const ItemWrapper = animated ? motion.div : 'div'
  const itemWrapperProps = animated
    ? {
        initial: { opacity: 0, x: -10 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.3, delay: 0 },
      }
    : {}

  return (
    <Container className={containerClasses} {...containerProps}>
      {/* Back Button */}
      {showBackButton && onBack && (
        <motion.div
          {...(animated && {
            whileHover: { scale: 1.05 },
            whileTap: { scale: 0.95 },
          })}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors px-2 py-2 h-9"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className={breadcrumbClasses} aria-label="breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm sm:gap-2.5">
          {items.map((item, index) => (
            <ItemWrapper
              key={item.label}
              className="contents"
              {...(animated
                ? {
                    ...itemWrapperProps,
                    transition: { duration: 0.3, delay: index * 0.1 },
                  }
                : {})}
            >
              <li className="inline-flex items-center gap-1.5">
                {item.isActive ? (
                  <span aria-current="page" className={activeItemClasses}>
                    {item.label}
                  </span>
                ) : (
                  <button
                    onClick={item.onClick}
                    className={linkClasses}
                    type="button"
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && item.onClick) {
                        e.preventDefault()
                        item.onClick()
                      }
                    }}
                  >
                    {item.label}
                  </button>
                )}
              </li>

              {index < items.length - 1 && (
                <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
                  <ChevronRight className={separatorClasses} />
                </li>
              )}
            </ItemWrapper>
          ))}
        </ol>
      </nav>
    </Container>
  )
}

// Export the old name for backward compatibility
export const StrategyBreadcrumb = Breadcrumb
