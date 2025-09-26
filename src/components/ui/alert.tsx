import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils/cn'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
      },
      type: {
        info: 'bg-[color-mix(in_srgb,var(--brand-primary) 10%,transparent)] border-[color-mix(in_srgb,var(--brand-primary) 25%,transparent)] text-[var(--text-primary)] [&>svg]:text-[var(--brand-primary)]',
        success: 'bg-green-500/10 border-green-500/30 text-green-200 [&>svg]:text-green-400',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200 [&>svg]:text-yellow-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-200 [&>svg]:text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

const alertTitles = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
}

interface AlertProps extends React.ComponentProps<'div'>, VariantProps<typeof alertVariants> {
  type?: keyof typeof alertIcons
  title?: string
  description?: string
}

function Alert({ className, variant, type, title, description, children, ...props }: AlertProps) {
  // If type is provided, use the type-based styling and auto-generate content
  if (type) {
    const Icon = alertIcons[type]
    const autoTitle = title || alertTitles[type]

    return (
      <div
        data-slot="alert"
        role="alert"
        className={cn(alertVariants({ type }), className)}
        {...props}
      >
        <Icon className="h-4 w-4" />
        <AlertTitle>{autoTitle}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
        {children}
      </div>
    )
  }

  // Fallback to original API for backward compatibility
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
export type { AlertProps }
