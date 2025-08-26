import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LeverageBadgeProps {
  leverage: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1',
    icon: 'h-2.5 w-2.5',
    text: 'text-xs',
  },
  md: {
    container: 'px-2 py-1',
    icon: 'h-3 w-3',
    text: 'text-sm',
  },
  lg: {
    container: 'px-3 py-1.5',
    icon: 'h-4 w-4',
    text: 'text-base',
  },
}

export function LeverageBadge({ leverage, size = 'md', className }: LeverageBadgeProps) {
  const sizeConfig = sizeClasses[size]

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-2 py-1 rounded border border-purple-500/30',
        sizeConfig.container,
        className,
      )}
    >
      <BarChart3 className={cn('text-purple-400', sizeConfig.icon)} />
      <span className={cn('text-purple-400 font-medium', sizeConfig.text)}>{leverage}x</span>
    </div>
  )
}
