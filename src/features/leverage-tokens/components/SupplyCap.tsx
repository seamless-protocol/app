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
          className={cn('text-sm font-medium', isNearCapacity ? 'text-red-400' : 'text-slate-300')}
        >
          {available.toLocaleString()}
        </span>
        {isNearCapacity && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <WarningIcon />
              </div>
            </TooltipTrigger>
            <TooltipContent className="px-3 py-1.5 bg-black text-sm">
              <p className="font-medium text-red-400">
                Supply cap {fillPercentage.toFixed(1)}% full
                <br />
                <span className="text-slate-400 text-sm">Minting may be limited</span>
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-xs text-slate-500">of {supplyCap.toLocaleString()}</span>
    </div>
  )
}
