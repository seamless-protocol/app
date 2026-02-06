import { ChevronDown, ChevronUp, Info, Percent } from 'lucide-react'
import { type Ref, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/cn'

interface SlippageInputProps {
  label: string
  tooltipText: string
  presets: ReadonlyArray<string>
  value: string
  onChange: (value: string) => void
  inputRef?: Ref<HTMLInputElement>
  step: number
  min: number
  max: number
  precision: number
  placeholder?: string
}

export function SlippageInput({
  label,
  tooltipText,
  presets,
  value,
  onChange,
  inputRef,
  step,
  min,
  max,
  precision,
  placeholder = '0.5',
}: SlippageInputProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const handleStepChange = (direction: 'up' | 'down') => {
    const currentValue = parseFloat(value) || 0
    const nextValue =
      direction === 'up' ? Math.min(currentValue + step, max) : Math.max(currentValue - step, min)

    onChange(nextValue.toFixed(precision))
  }

  return (
    <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-foreground">{label}</div>
          <div className="mr-2">
            <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-text-muted hover:text-secondary-foreground transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-0 -m-2 sm:m-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    setTooltipOpen((prev) => !prev)
                  }}
                >
                  <Info className="h-5 w-5 sm:h-3 sm:w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-2xs p-0 text-sm bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)]">
                <div className="min-w-52 max-w-2xs space-y-2 rounded-lg border border-border bg-card p-4">
                  <div className="text-sm wrap-break-word text-text-primary">{tooltipText}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {presets.map((preset) => (
            <Button
              key={preset}
              variant={value === preset ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(preset)}
              className={cn(
                'h-8 px-3 text-xs transition-colors',
                value === preset
                  ? 'border border-brand-purple bg-brand-purple text-primary-foreground hover:opacity-90'
                  : 'border border-divider-line text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:text-foreground',
              )}
            >
              {preset}%
            </Button>
          ))}
          <div className="flex items-center space-x-1">
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-8 w-16 border border-border bg-input text-center text-xs text-foreground pr-6"
                placeholder={placeholder}
              />
              <div className="absolute right-1 top-0 flex h-full flex-col items-center justify-center space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleStepChange('up')}
                  className="flex h-4 w-4 items-center justify-center hover:bg-muted rounded-sm transition-colors"
                >
                  <ChevronUp className="h-2 w-2 text-muted-foreground hover:text-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepChange('down')}
                  className="flex h-4 w-4 items-center justify-center hover:bg-muted rounded-sm transition-colors"
                >
                  <ChevronDown className="h-2 w-2 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
            <Percent className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Card>
  )
}
