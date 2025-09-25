import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible'
import { Skeleton } from '../../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'

export interface MetricItem {
  label: string
  value: string
  highlight?: boolean
  color?: string
  tooltip: string
}

export interface LeverageTokenMetrics {
  [category: string]: Array<MetricItem>
}

interface LeverageTokenDetailedMetricsProps {
  metrics?: LeverageTokenMetrics | undefined
  title?: string
  description?: string
  defaultOpen?: boolean
  className?: string
  isLoading?: boolean
  isError?: boolean
}

export function LeverageTokenDetailedMetrics({
  metrics,
  title = 'Detailed Metrics',
  description = 'Comprehensive leverage token parameters and settings',
  defaultOpen = false,
  className = '',
  isLoading = false,
  isError = false,
}: LeverageTokenDetailedMetricsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          'border border-[var(--divider-line)] text-[var(--text-primary)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)]',
          className,
        )}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-colors rounded-t-lg px-6 py-6 hover:bg-[color-mix(in_srgb,var(--surface-elevated) 45%,transparent)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="space-y-2">
                  <CardTitle className="text-[var(--text-primary)]">{title}</CardTitle>
                  <p className="text-sm text-[var(--text-muted)]">{description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-elevated) 40%,transparent)] text-[var(--text-secondary)]"
                  >
                    {isOpen ? 'Hide Details' : 'Show Details'}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
                    <div
                      key={`metric-skel-${key}`}
                      className="p-4 rounded-lg border bg-slate-800/50 border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-3 w-28" />
                        <div className="h-3 w-3" />
                      </div>
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-red-500">Failed to load detailed metrics</div>
                </div>
              ) : metrics ? (
                Object.entries(metrics).map(([category, categoryMetrics]) => (
                  <div key={category} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-[var(--text-primary)]">
                        {category}
                      </h3>
                      <div className="flex-1 h-px bg-[var(--divider-line)]" />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryMetrics.map((metric, index) => (
                        <div
                          key={`${category}-${metric.label}-${index}`}
                          className={cn(
                            'p-4 rounded-lg border transition-colors bg-[color-mix(in_srgb,var(--surface-card) 90%,transparent)] border-[var(--divider-line)]',
                            metric.highlight &&
                              'bg-[color-mix(in_srgb,var(--surface-elevated) 70%,transparent)] border-[color-mix(in_srgb,var(--divider-line) 80%,transparent)]',
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-[var(--text-secondary)]">
                                {metric.label}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="p-0 text-sm bg-[color-mix(in_srgb,var(--surface-card) 94%,transparent)] border border-[var(--divider-line)]">
                                  <div className="p-3 max-w-xs">
                                    <p className="text-sm text-[var(--text-primary)]">
                                      {metric.tooltip}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <p
                            className={cn(
                              'text-lg font-semibold text-[var(--text-primary)]',
                              metric.color,
                            )}
                          >
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-[var(--text-secondary)]">No detailed metrics available</div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}
