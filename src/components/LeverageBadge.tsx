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
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-2 py-0.5 w-fit whitespace-nowrap shrink-0 text-purple-400 border-purple-400/30 bg-purple-400/10 text-sm font-medium',
        sizeConfig.container,
        className,
      )}
    >
      {leverage}x
    </span>
  )
}
