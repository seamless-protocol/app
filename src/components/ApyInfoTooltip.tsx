import { Info } from 'lucide-react'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { LeverageToken } from '@/features/leverage-tokens/components/leverage-token-table'

type IconSize = 'sm' | 'md' | 'lg'

interface ApyInfoTooltipProps {
  token: LeverageToken
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
  token,
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
  // Use responsive classes so mobile can be larger while desktop stays small
  const iconClass =
    iconSize === 'lg'
      ? 'h-5 w-5 sm:h-3 sm:w-3'
      : iconSize === 'md'
        ? 'h-4 w-4 sm:h-3 sm:w-3'
        : 'h-3 w-3'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={
            'rounded text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--divider-line)] ' +
            (buttonClassName ?? '')
          }
          aria-label="APY details"
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation()
          }}
        >
          <Info className={iconClass} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        className={`p-0 text-sm border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] ${className ?? ''}`}
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <APYBreakdownTooltip
          token={token}
          compact
          {...(apyData && { apyData })}
          isLoading={isLoading}
          isError={isError}
        />
      </TooltipContent>
    </Tooltip>
  )
}
