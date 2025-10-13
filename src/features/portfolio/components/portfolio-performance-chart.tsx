import { TrendingUp } from 'lucide-react'
import { useId } from 'react'
import {
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'

export interface PortfolioDataPoint {
  date: string
  value: number
  earnings?: number
  timestamp?: number
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
    } else if (value >= 1) {
      return value.toFixed(0)
    } else if (value >= 0.01) {
      return value.toFixed(2)
    } else if (value >= 0.001) {
      return value.toFixed(3)
    } else if (value > 0) {
      return value.toFixed(4)
    }
    return '0'
  }

  const defaultTooltipFormatter = (value: number | string, _name?: string): [string, string] => {
    const numValue = Number(value)
    if (numValue >= 1) {
      return [`$${numValue.toLocaleString('en-US')}`, 'Portfolio Value']
    } else if (numValue >= 0.01) {
      return [`$${numValue.toFixed(2)}`, 'Portfolio Value']
    } else if (numValue >= 0.001) {
      return [`$${numValue.toFixed(3)}`, 'Portfolio Value']
    } else if (numValue > 0) {
      return [`$${numValue.toFixed(4)}`, 'Portfolio Value']
    }
    return ['$0', 'Portfolio Value']
  }

  const formatCurrency = yAxisFormatter || defaultYAxisFormatter
  const formatTooltipValue = tooltipFormatter || defaultTooltipFormatter

  // Check if we have data to display
  const hasData = data && data.length > 0

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-foreground">{title}</CardTitle>
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
          {hasData ? (
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
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12, dy: 8 }}
                  tickFormatter={(dateString: string) => {
                    const date = new Date(dateString)
                    // Handle different timeframes with appropriate formatting
                    if (selectedTimeframe === '1Y') {
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    } else {
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickFormatter={formatCurrency}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    offset: -1,
                    style: {
                      textAnchor: 'middle',
                      fill: 'var(--text-secondary)',
                      fontSize: '12px',
                    },
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--divider-line)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
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
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-secondary-foreground mb-2">
                No Data Available
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Portfolio performance data will appear here once you have active positions with
                historical data.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
