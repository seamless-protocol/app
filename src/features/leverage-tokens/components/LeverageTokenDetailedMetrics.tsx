'use client'

import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip'

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
  metrics: LeverageTokenMetrics
  title?: string
  description?: string
  defaultOpen?: boolean
  className?: string
}

export function LeverageTokenDetailedMetrics({
  metrics,
  title = 'Detailed Metrics',
  description = 'Comprehensive leverage token parameters and settings',
  defaultOpen = false,
  className = '',
}: LeverageTokenDetailedMetricsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`bg-slate-900/80 border-slate-700 ${className}`}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors rounded-t-lg px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-white">{title}</CardTitle>
                  <p className="text-slate-400 text-sm">{description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-slate-800/50 text-slate-400 border-slate-600 text-xs"
                  >
                    {isOpen ? 'Hide Details' : 'Show Details'}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {Object.entries(metrics).map(([category, categoryMetrics]) => (
                <div key={category} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryMetrics.map((metric, index) => (
                      <div
                        key={`${category}-${metric.label}-${index}`}
                        className={`p-4 rounded-lg border transition-colors ${
                          metric.highlight
                            ? 'bg-slate-800/70 border-slate-600'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-1 cursor-help">
                                  <span className="text-slate-400 text-sm">{metric.label}</span>
                                  <Info className="w-3 h-3 text-slate-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-slate-800 border border-slate-600 text-white">
                                <p className="text-sm">{metric.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className={`text-lg font-semibold ${metric.color || 'text-white'}`}>
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}
