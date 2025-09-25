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
  iconBgClass = 'bg-[color-mix(in_srgb,var(--brand-secondary)_20%,transparent)]',
  iconTextClass = 'text-[var(--brand-secondary)]',
  className,
}: StatCardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-6 rounded-xl border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] text-[var(--text-primary)] transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--surface-elevated) 45%,transparent)]',
        className,
      )}
    >
      <div data-slot="card-content" className="[&:last-child]:pb-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--text-secondary)]">{title}</div>
            <div className="text-xl font-bold sm:text-2xl text-[var(--text-primary)]">{stat}</div>
            {caption && <div className="mt-1 text-xs text-[var(--text-muted)]">{caption}</div>}
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
