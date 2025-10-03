import type * as React from 'react'
import { cn } from './ui/utils'

export interface StatCardProps {
  title: string | React.ReactNode
  stat: string | React.ReactNode
  caption?: string | React.ReactNode
  icon?: React.ReactNode
  iconBgClass?: string
  iconTextClass?: string
  className?: string
}

function StatCard({
  title,
  stat,
  caption,
  icon,
  iconBgClass = 'bg-accent',
  iconTextClass = 'text-brand-purple',
  className,
}: StatCardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-6 rounded-xl border border-border bg-card text-foreground transition-all duration-300 hover:bg-accent',
        className,
      )}
    >
      <div data-slot="card-content" className="[&:last-child]:pb-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-secondary-foreground">{title}</div>
            <div className="text-xl font-bold sm:text-2xl text-foreground">{stat}</div>
            {caption && <div className="mt-1 text-xs text-muted-foreground">{caption}</div>}
          </div>
          {icon && (
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${iconBgClass} ${iconTextClass}`}
              aria-hidden="true"
            >
              <div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">{icon}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { StatCard }
