'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { Formatter, NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { cn } from '@/lib/utils/cn'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export interface PriceDataPoint {
  date: string
  price?: number
  tvl?: number
  weethPrice?: number
  leverageTokenPrice?: number
}

export interface ChartLine {
  key: string
  name: string
  color: string
  dataKey: string
}

export interface PriceLineChartProps {
  data: Array<PriceDataPoint>
  selectedTimeframe: string
  onTimeframeChange: (timeframe: string) => void
  timeframes?: Array<string>
  chartType?: 'price' | 'tvl' | 'comparison'
  chartLines?: Array<ChartLine>
  visibleLines?: Record<string, boolean>
  onLineVisibilityChange?: (lineKey: string) => void
  className?: string
  title?: string
  subtitle?: string
  height?: number
  xAxisFormatter?: (dateString: string) => string
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: Formatter<ValueType, NameType>
  labelFormatter?: (dateString: string) => string
  yAxisLabel?: string
  dataKey?: string
  strokeColor?: string
}

export function PriceLineChart({
  data,
  selectedTimeframe,
  onTimeframeChange,
  timeframes = ['1H', '1D', '1W', '1M', '3M', '1Y'],
  chartType = 'price',
  chartLines = [],
  visibleLines = {},
  onLineVisibilityChange,
  className,
  title = 'Price Performance',
  subtitle = 'Historical price and performance data',
  height = 320,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  labelFormatter,
  yAxisLabel,
  dataKey,
  strokeColor,
}: PriceLineChartProps) {
  // Default formatters
  const defaultXAxisFormatter = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  const defaultYAxisFormatter = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(6)}` // Show 6 decimal places for price data
  }

  const defaultTooltipFormatter: Formatter<ValueType, NameType> = (value, name) => {
    if (Array.isArray(value)) {
      value = value.join(' ~ ')
    }

    if (chartType === 'tvl') {
      return [`$${Number(value).toFixed(2)}M`, 'TVL']
    }
    const numValue = Number(value)
    if (numValue >= 1) {
      return [
        `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`,
        name || 'Price',
      ]
    } else if (numValue >= 0.01) {
      return [`$${numValue.toFixed(6)}`, name || 'Price']
    } else if (numValue >= 0.001) {
      return [`$${numValue.toFixed(8)}`, name || 'Price']
    } else if (numValue > 0) {
      return [`$${numValue.toFixed(10)}`, name || 'Price']
    }
    return ['$0', name || 'Price']
  }

  const defaultLabelFormatter = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
    })
  }

  const formatChartDate = xAxisFormatter || defaultXAxisFormatter
  const formatYAxis = yAxisFormatter || defaultYAxisFormatter
  const formatTooltipValue = tooltipFormatter || defaultTooltipFormatter
  const formatTooltipLabel = labelFormatter || defaultLabelFormatter

  // Get chart configuration based on chart type
  const getChartConfig = () => {
    switch (chartType) {
      case 'tvl':
        return {
          dataKey: dataKey || 'tvl',
          yAxisLabel: yAxisLabel || 'TVL ($)',
          strokeColor: strokeColor || 'var(--chart-4)',
          yAxisFormatter: (value: number) => `$${value.toFixed(0)}M`,
        }
      case 'comparison':
        return {
          dataKey: dataKey || 'weethPrice',
          yAxisLabel: yAxisLabel || 'Price ($)',
          strokeColor: strokeColor || 'var(--chart-1)',
          yAxisFormatter: formatYAxis,
        }
      default:
        return {
          dataKey: dataKey || 'price',
          yAxisLabel: yAxisLabel || 'Price ($)',
          strokeColor: strokeColor || 'var(--chart-1)',
          yAxisFormatter: formatYAxis,
        }
    }
  }

  const chartConfig = getChartConfig()

  return (
    <Card
      className={cn(
        'border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)]',
        className,
      )}
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 space-y-3 sm:space-y-0">
        <div>
          <CardTitle className="text-lg text-foreground">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-1 rounded-lg p-1 border border-border bg-card">
          {timeframes.map((timeframe) => (
            <button
              type="button"
              key={timeframe}
              onClick={() => onTimeframeChange(timeframe)}
              className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                selectedTimeframe === timeframe
                  ? 'bg-brand-purple text-primary-foreground shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-foreground hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)]'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent style={{ height: `${height + 45}px` }} className="pt-0 px-6 pb-6">
        <div style={{ height: `${height}px` }} className="w-full">
          {chartType === 'comparison' && chartLines.length > 0 && (
            <>
              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {chartLines.map((line) => (
                  <button
                    type="button"
                    key={line.key}
                    onClick={() => onLineVisibilityChange?.(line.key)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md border transition-all ${
                      visibleLines[line.key]
                        ? 'border-border bg-accent'
                        : 'border-border/60 bg-card opacity-60'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="text-sm text-[var(--text-secondary)]">{line.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} style={{ cursor: 'default' }}>
              <CartesianGrid
                stroke="var(--divider-line)"
                strokeDasharray="3 3"
                strokeOpacity={0.55}
                vertical
                horizontal
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12, dy: 8 }}
                tickFormatter={formatChartDate}
              />
              <YAxis
                {...(chartType === 'comparison'
                  ? { domain: ['dataMin', 'dataMax'] as [string, string] }
                  : { dataKey: chartConfig.dataKey })}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                tickFormatter={chartConfig.yAxisFormatter}
                label={{
                  value: chartConfig.yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: '12px' },
                }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-card)',
                  border: `1px solid var(--divider-line)`,
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
                formatter={formatTooltipValue}
                labelFormatter={formatTooltipLabel}
              />
              {chartType === 'comparison' && chartLines.length > 0 ? (
                // Render comparison lines
                chartLines.map(
                  (line) =>
                    visibleLines[line.key] && (
                      <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.dataKey}
                        stroke={line.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                        name={line.name}
                      />
                    ),
                )
              ) : (
                // Render single line based on chart type
                <Line
                  type="monotone"
                  dataKey={chartConfig.dataKey}
                  stroke={chartConfig.strokeColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  name={chartType === 'tvl' ? 'TVL' : 'Price'}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
