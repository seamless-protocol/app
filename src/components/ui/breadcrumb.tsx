'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import * as React from 'react'
import { Button } from './button'
import { cn } from './utils'

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<'nav'> & {
    separator?: React.ComponentType<{ className?: string }>
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
        className,
      )}
      {...props}
    />
  ),
)
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  ),
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & {
    asChild?: boolean
  }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : 'a'

  return (
    <Comp
      ref={ref}
      className={cn('transition-colors hover:text-foreground cursor-pointer', className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  ),
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis'

// Higher-level breadcrumb component with back button and item management
export interface BreadcrumbItem {
  label: string
  onClick?: () => void
  isActive?: boolean
}

export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[]
  onBack?: () => void
  showBackButton?: boolean
  animated?: boolean
  className?: string
}

const BreadcrumbNavigation = React.forwardRef<HTMLDivElement, BreadcrumbNavigationProps>(
  ({ items, onBack, showBackButton = true, animated = true, className = '' }, ref) => {
    const Wrapper = animated ? motion.div : 'div'
    const wrapperProps = animated
      ? {
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3 },
        }
      : {}

    return (
      <Wrapper
        ref={ref}
        className={cn('flex items-center space-x-4 mb-6', className)}
        {...wrapperProps}
      >
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
        <Breadcrumb className="flex-1">
          <BreadcrumbList>
            {items.map((item, index) => (
              <motion.div
                key={item.label}
                className="contents"
                {...(animated && {
                  initial: { opacity: 0, x: -10 },
                  animate: { opacity: 1, x: 0 },
                  transition: { duration: 0.3, delay: index * 0.1 },
                })}
              >
                <BreadcrumbItem>
                  {item.isActive ? (
                    <BreadcrumbPage className="text-white font-medium">{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={item.onClick}
                      className="text-slate-400 hover:text-purple-400 transition-colors font-medium"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && item.onClick) {
                          e.preventDefault()
                          item.onClick()
                        }
                      }}
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {index < items.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </BreadcrumbSeparator>
                )}
              </motion.div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </Wrapper>
    )
  },
)
BreadcrumbNavigation.displayName = 'BreadcrumbNavigation'

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  BreadcrumbNavigation,
}
