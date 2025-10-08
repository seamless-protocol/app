import { cn } from '@/lib/utils/cn'
import { WarningIcon } from '../../../components/icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'

interface SupplyCapProps {
  currentSupply: number
  supplyCap: number
  className?: string
}

export function SupplyCap({ currentSupply, supplyCap, className }: SupplyCapProps) {
  const fillPercentage = (currentSupply / supplyCap) * 100
  const available = supplyCap - currentSupply

  // Show red warning when supply is nearly full (90%+)
  const isNearCapacity = fillPercentage >= 90

  return (
    <div className={cn('flex flex-col items-end space-y-1', className)}>
      <div className="flex items-center space-x-2">
        <span
          className={cn(
            'text-sm font-medium',
            isNearCapacity ? 'text-[var(--state-error-text)]' : 'text-foreground',
          )}
        >
          {available.toLocaleString('en-US')}
        </span>
        {isNearCapacity && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <WarningIcon />
              </div>
            </TooltipTrigger>
            <TooltipContent className="px-3 py-1.5 text-sm border border-border bg-card text-foreground">
              <p className="font-medium text-[var(--state-error-text)]">
                Supply cap {fillPercentage.toFixed(1)}% full
                <br />
                <span className="text-secondary-foreground text-sm">Minting may be limited</span>
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-xs text-muted-foreground">of {supplyCap.toLocaleString('en-US')}</span>
    </div>
  )
}
