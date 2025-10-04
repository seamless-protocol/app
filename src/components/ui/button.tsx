import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils/cn'

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer"

const centeredLabelClasses =
  // Keep label perfectly centered while allowing tight icon next to text
  'relative text-center has-[>svg:first-child]:pl-8 has-[>svg:last-child]:pr-8 [&>svg:first-child]:absolute [&>svg:first-child]:left-4 [&>svg:first-child]:top-1/2 [&>svg:first-child]:-translate-y-1/2 [&>svg:last-child]:absolute [&>svg:last-child]:right-4 [&>svg:last-child]:top-1/2 [&>svg:last-child]:-translate-y-1/2'

const buttonVariants = cva(baseClasses, {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50',
      gradient:
        'border border-transparent bg-cta-gradient text-[12px] font-bold leading-none transition-all duration-200 hover:bg-cta-hover-gradient hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 active:bg-cta-active-gradient active:translate-y-0 disabled:bg-cta-gradient disabled:text-[var(--cta-text)] disabled:opacity-50 disabled:hover:bg-cta-gradient disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:active:bg-cta-gradient disabled:active:translate-y-0',
      destructive:
        'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 disabled:opacity-50',
      outline:
        'border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50',
      ghost:
        'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 disabled:opacity-50',
      link: 'text-primary underline-offset-4 hover:underline disabled:opacity-50',
    },
    size: {
      default: 'h-9 px-4 py-2 has-[>svg]:px-3',
      sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
      lg: 'h-[40px] rounded-[8px] px-6 has-[>svg]:px-4',
      icon: 'size-9 rounded-md',
    },
    align: {
      inline: '',
      centered: centeredLabelClasses,
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    align: 'inline',
  },
})

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(({ className, variant, size, align, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, align, className }))}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = 'Button'

export { Button, buttonVariants }
