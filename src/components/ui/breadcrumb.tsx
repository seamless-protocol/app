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
  items: Array<BreadcrumbItem>
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
      <Wrapper ref={ref} className={cn('mb-4 sm:mb-6', className)} {...wrapperProps}>
        {/* Mobile: Stacked layout */}
        <div className="flex flex-col space-y-2 sm:hidden">
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
                className="text-slate-400 hover:text-foreground hover:bg-slate-800 transition-colors px-2 py-2 h-9 w-fit"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Breadcrumb Navigation - Mobile */}
          <Breadcrumb className="w-full">
            <BreadcrumbList className="flex-wrap">
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
                      <BreadcrumbPage className="text-foreground font-medium text-sm truncate max-w-[200px]">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="text-secondary-foreground hover:text-purple-400 transition-colors font-medium bg-transparent border-none p-0 cursor-pointer text-sm"
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
                  </BreadcrumbItem>

                  {index < items.length - 1 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-3 w-3 text-secondary-foreground" />
                    </BreadcrumbSeparator>
                  )}
                </motion.div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex items-center space-x-4">
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
                className="text-secondary-foreground hover:text-foreground hover:bg-slate-800 transition-colors px-2 py-2 h-9"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Breadcrumb Navigation - Desktop */}
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
                      <BreadcrumbPage className="text-white font-medium">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="text-slate-400 hover:text-purple-400 transition-colors font-medium bg-transparent border-none p-0 cursor-pointer"
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
        </div>
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
