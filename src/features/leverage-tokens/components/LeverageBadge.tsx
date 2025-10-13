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
        'inline-flex items-center justify-center rounded-md border font-medium w-fit whitespace-nowrap shrink-0',
        'bg-[color-mix(in_srgb,var(--brand-secondary) 15%,transparent)] text-[var(--brand-secondary)] border-[var(--brand-secondary)]/30',
        'dark:bg-[#2A1D3F] dark:text-[#C15BDB] dark:border-[#C15BDB]/30',
        'hover:bg-[color-mix(in_srgb,var(--brand-secondary) 20%,transparent)] dark:hover:bg-[#3A2D4F] transition-colors',
        sizeConfig.container,
        sizeConfig.text,
        className,
      )}
    >
      {leverage}x
    </span>
  )
}
