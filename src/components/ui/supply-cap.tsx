import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SupplyCapProps {
  currentSupply: number
  supplyCap: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    container: 'space-y-1',
    text: 'text-xs',
    progress: 'h-1',
    icon: 'w-2.5 h-2.5',
  },
  md: {
    container: 'space-y-1',
    text: 'text-sm',
    progress: 'h-1.5',
    icon: 'w-3 h-3',
  },
  lg: {
    container: 'space-y-2',
    text: 'text-base',
    progress: 'h-2',
    icon: 'w-4 h-4',
  },
}

export function SupplyCap({ currentSupply, supplyCap, size = 'md', className }: SupplyCapProps) {
  const sizeConfig = sizeClasses[size]
  const fillPercentage = (currentSupply / supplyCap) * 100
  const available = supplyCap - currentSupply

  const isNearCapacity = fillPercentage >= 90

  return (
    <div className={cn('flex flex-col items-end', sizeConfig.container, className)}>
      <div className="flex items-center space-x-2">
        {isNearCapacity && <AlertTriangle className={cn('text-warning-yellow', sizeConfig.icon)} />}
        <span
          className={cn(sizeConfig.text, isNearCapacity ? 'text-warning-yellow' : 'text-slate-300')}
        >
          {available.toLocaleString()}
        </span>
        <span className={cn('text-slate-500', sizeConfig.text)}>
          / {supplyCap.toLocaleString()}
        </span>
      </div>

      <div
        className={cn('bg-slate-700 rounded-full', sizeConfig.progress)}
        style={{ width: '80px' }}
      >
        <div
          className={cn(
            'rounded-full transition-all duration-300',
            sizeConfig.progress,
            isNearCapacity
              ? 'bg-gradient-to-r from-warning-yellow to-error-red'
              : 'bg-gradient-to-r from-purple-500 to-pink-500',
          )}
          style={{ width: `${fillPercentage}%` }}
        />
      </div>

      <div className="flex items-center space-x-1">
        <span
          className={cn(
            sizeConfig.text,
            isNearCapacity ? 'text-warning-yellow font-medium' : 'text-slate-400',
          )}
        >
          {fillPercentage.toFixed(1)}% filled
        </span>
        {isNearCapacity && (
          <span className={cn('text-warning-yellow font-medium', sizeConfig.text)}>⚠</span>
        )}
      </div>
    </div>
  )
}
