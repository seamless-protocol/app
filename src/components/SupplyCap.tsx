import { cn } from '@/lib/utils/cn'

interface SupplyCapProps {
  currentSupply: number
  supplyCap: number
  className?: string
}

export function SupplyCap({ currentSupply, supplyCap, className }: SupplyCapProps) {
  const fillPercentage = (currentSupply / supplyCap) * 100
  const available = supplyCap - currentSupply

  return (
    <div className={cn('flex flex-col items-end space-y-1', className)}>
      <span className="text-slate-300 font-medium text-sm">{available.toLocaleString()}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-300"
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{fillPercentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}
