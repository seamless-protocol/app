import type * as React from 'react'
import { cn } from './ui/utils'

export interface StatCardProps {
  title: string
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
  iconBgClass = 'bg-purple-500/20',
  iconTextClass = 'text-purple-400',
  className,
}: StatCardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        'text-card-foreground flex flex-col gap-6 rounded-xl border bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-300',
        className,
      )}
    >
      <div data-slot="card-content" className="[&:last-child]:pb-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <div className="text-xl sm:text-2xl font-bold text-white">{stat}</div>
            {caption && <div className="text-xs text-slate-400 mt-1">{caption}</div>}
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
