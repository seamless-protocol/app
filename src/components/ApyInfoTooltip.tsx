import { Info } from 'lucide-react'
import { useState } from 'react'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type IconSize = 'sm' | 'md' | 'lg'

interface ApyInfoTooltipProps {
  apyData?: APYBreakdownData | undefined
  isLoading?: boolean
  isError?: boolean
  iconSize?: IconSize
  className?: string
  buttonClassName?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  stopPropagation?: boolean
}

export function ApyInfoTooltip({
  apyData,
  isLoading = false,
  isError = false,
  iconSize = 'sm',
  className,
  buttonClassName,
  side = 'top',
  align = 'end',
  sideOffset = 8,
  stopPropagation = true,
}: ApyInfoTooltipProps) {
  // Controlled state for mobile tap-to-toggle behavior
  const [open, setOpen] = useState(false)

  // Use responsive classes so mobile can be larger while desktop stays small
  const iconClass =
    iconSize === 'lg'
      ? 'h-5 w-5 sm:h-4 sm:w-4'
      : iconSize === 'md'
        ? 'h-5 w-5 sm:h-3.5 sm:w-3.5'
        : 'h-4 w-4 sm:h-3 sm:w-3'

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    // Toggle on mobile, let hover work on desktop
    setOpen((prev) => !prev)
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={
            'inline-flex items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--divider-line)] min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-0 -m-2 sm:m-0 ' +
            (buttonClassName ?? '')
          }
          aria-label="APY details"
          onClick={handleClick}
        >
          <Info className={iconClass} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        className={`max-w-[min(92vw,420px)] p-0 text-sm border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] ${className ?? ''}`}
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <APYBreakdownTooltip compact apyData={apyData} isLoading={isLoading} isError={isError} />
      </TooltipContent>
    </Tooltip>
  )
}
