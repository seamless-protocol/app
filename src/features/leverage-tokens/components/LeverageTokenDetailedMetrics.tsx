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
  value: string | React.ReactNode
  highlight?: boolean
  color?: string
  tooltip?: string
  isLoading?: boolean
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
      <Card className={cn('border border-rounded text-foreground bg-card', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-colors rounded-t-lg px-6 py-6 relative overflow-hidden hover:before:absolute hover:before:inset-0 hover:before:bg-accent hover:before:rounded-t-lg hover:before:opacity-50 hover:before:content-['']">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="space-y-2">
                  <CardTitle className="text-foreground">{title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-elevated) 40%,transparent)] text-secondary-foreground"
                  >
                    {isOpen ? 'Hide Details' : 'Show Details'}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
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
                      className="p-4 rounded-lg border border-border bg-card"
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
                  <div className="text-[var(--state-error-text)]">
                    Failed to load detailed metrics
                  </div>
                </div>
              ) : metrics ? (
                Object.entries(metrics).map(([category, categoryMetrics]) => (
                  <div key={category} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-foreground">
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
                            'p-4 rounded-lg border transition-colors bg-accent border-border',
                            metric.highlight && 'bg-accent border-border',
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-secondary-foreground">
                                {metric.label}
                              </span>
                              {metric.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-secondary-foreground transition-colors"
                                    >
                                      <Info className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="p-0 text-sm bg-card border border-border">
                                    <div className="p-3 max-w-xs">
                                      <p className="text-foreground text-sm">{metric.tooltip}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          {metric.isLoading ? (
                            <Skeleton className="h-6 w-24" />
                          ) : typeof metric.value === 'string' ? (
                            <p
                              className={cn('text-lg font-semibold text-foreground', metric.color)}
                            >
                              {metric.value}
                            </p>
                          ) : (
                            <div className="text-lg font-semibold">{metric.value}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-secondary-foreground">No detailed metrics available</div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}
