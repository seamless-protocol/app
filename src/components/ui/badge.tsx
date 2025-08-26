import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from './utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-secondary bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        secondary:
          'border-secondary bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-destructive bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean
  /** Logo component to display */
  logo?: React.ComponentType<{ size?: number; className?: string }>
  /** Size of the logo in pixels */
  logoSize?: number
  /** Whether to show the full name or just symbol */
  showName?: boolean
  /** Whether to make it clickable */
  clickable?: boolean
  /** Click handler for clickable badges */
  onClick?: (e: React.MouseEvent) => void
}

function Badge({
  className,
  variant,
  asChild = false,
  logo,
  logoSize = 16,
  showName = false,
  clickable = false,
  onClick,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : 'span'

  // If logo is provided, render as pill-style badge
  if (logo) {
    const LogoComponent = logo
    const content = (
      <div className={cn(
        "flex items-center space-x-2",
        clickable && "hover:bg-secondary/90 transition-colors rounded cursor-pointer",
        className
      )}>
        <div className={cn(
          "rounded-full border border-secondary bg-secondary flex items-center justify-center p-0.5",
          logoSize <= 16 && "w-4 h-4",
          logoSize > 16 && logoSize <= 20 && "w-5 h-5", 
          logoSize > 20 && logoSize <= 24 && "w-6 h-6",
          logoSize > 24 && "w-8 h-8"
        )}>
          <LogoComponent size={logoSize} />
        </div>
        
        <span className="font-medium text-secondary-foreground text-sm truncate">
          {showName && typeof children === 'string' && children.includes(' ') 
            ? children 
            : children}
        </span>
      </div>
    )

    if (clickable && onClick) {
      return (
        <button onClick={onClick} className="w-full text-left">
          {content}
        </button>
      )
    }

    return content
  }

  // Regular badge
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>{children}</Comp>
}

export { Badge, badgeVariants }
