'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export interface PortfolioDataPoint {
  date: string
  value: number
  earnings?: number
}

export interface PortfolioPerformanceChartProps {
  data: Array<PortfolioDataPoint>
  selectedTimeframe: string
  onTimeframeChange: (timeframe: string) => void
  timeframes?: Array<string>
  className?: string
  title?: string
  height?: number
  gradientColors?: {
    start: string
    end: string
  }
  strokeColor?: string
  yAxisLabel?: string
  tooltipFormatter?: (value: number | string, name?: string) => [string, string]
  yAxisFormatter?: (value: number) => string
}

export function PortfolioPerformanceChart({
  data,
  selectedTimeframe,
  onTimeframeChange,
  timeframes = ['7D', '30D', '90D', '1Y'],
  className,
  title = 'Portfolio Performance',
  height = 256,
  gradientColors = { start: '#A16CFE', end: '#A16CFE' },
  strokeColor = '#A16CFE',
  yAxisLabel = 'Portfolio Value ($)',
  tooltipFormatter,
  yAxisFormatter,
}: PortfolioPerformanceChartProps) {
  const gradientId = useId()

  // Default formatters
  const defaultYAxisFormatter = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toFixed(0)
  }

  const defaultTooltipFormatter = (value: number | string, _name?: string): [string, string] => {
    return [`$${Number(value).toLocaleString()}`, 'Portfolio Value']
  }

  const formatCurrency = yAxisFormatter || defaultYAxisFormatter
  const formatTooltipValue = tooltipFormatter || defaultTooltipFormatter

  return (
    <Card className={`bg-slate-900/80 border-slate-700 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-white">{title}</CardTitle>
          <div className="flex space-x-1">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTimeframeChange(timeframe)}
                className="text-xs px-3 py-1"
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-6 pb-6">
        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} style={{ cursor: 'default' }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientColors.start} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={gradientColors.end} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12, dy: 8 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={formatCurrency}
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748B', fontSize: '12px' },
                }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                }}
                formatter={formatTooltipValue}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
