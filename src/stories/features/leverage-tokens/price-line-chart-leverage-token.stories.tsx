import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type {
  ChartLine,
  PriceDataPoint,
  PriceLineChartProps,
} from '../../../components/ui/price-line-chart'
import { PriceLineChart } from '../../../components/ui/price-line-chart'

const meta: Meta<typeof PriceLineChart> = {
  title: 'Features/Leverage Tokens/PriceHistory',
  component: PriceLineChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock price data generator for leverage tokens
const generateLeverageTokenData = (
  days: number = 30,
  basePrice: number = 2456,
): Array<PriceDataPoint> => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))

    // Start from 0 and gradually increase
    const progress = i / (days - 1) // 0 to 1
    const baseProgress = progress * basePrice

    // Add some variation on top of the base progression
    const baseVariation = Math.sin(i * 0.3) * 0.02 + (Math.random() - 0.5) * 0.01
    const price = baseProgress * (1 + baseVariation)

    // Leverage token price with different base and higher volatility
    const leverageBaseProgress = progress * (basePrice * 0.8) // Start lower
    const leverageVariation = Math.sin(i * 0.4) * 0.03 + (Math.random() - 0.5) * 0.015 // Different pattern and higher volatility
    const leveragePrice = leverageBaseProgress * (1 + leverageVariation)

    return {
      date: date.toISOString().split('T')[0] || '', // YYYY-MM-DD format
      price: Math.round(Math.max(0, price * 100)) / 100,
      tvl: Math.round((100 + Math.random() * 30) * 100) / 100,
      weethPrice: Math.round(Math.max(0, price * 100)) / 100,
      leverageTokenPrice: Math.round(Math.max(0, leveragePrice * 100)) / 100,
    }
  })
}

// Wrapper component to handle state for leverage tokens
const LeverageTokenChartWrapper = ({
  data,
  chartLines = [],
  visibleLines = {},
  onLineVisibilityChange,
  timeframes,
  title,
  subtitle,
  height,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  yAxisLabel,
}: Pick<
  PriceLineChartProps,
  | 'data'
  | 'chartLines'
  | 'visibleLines'
  | 'onLineVisibilityChange'
  | 'timeframes'
  | 'title'
  | 'subtitle'
  | 'height'
  | 'xAxisFormatter'
  | 'yAxisFormatter'
  | 'tooltipFormatter'
  | 'yAxisLabel'
>) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1W')

  // Filter data based on selected timeframe
  const getFilteredData = (timeframe: string) => {
    let daysToShow: number

    switch (timeframe) {
      case '1H':
        daysToShow = 1
        break
      case '1D':
        daysToShow = 1
        break
      case '1W':
        daysToShow = 7
        break
      case '1M':
        daysToShow = 30
        break
      case '3M':
        daysToShow = 90
        break
      case '1Y':
        daysToShow = 365
        break
      default:
        daysToShow = 7
    }

    // Return the last N days of data
    return data.slice(-daysToShow)
  }

  const filteredData = getFilteredData(selectedTimeframe)

  return (
    <div className="min-w-5xl">
      <PriceLineChart
        data={filteredData}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
        chartType="comparison"
        chartLines={chartLines}
        visibleLines={visibleLines}
        {...(onLineVisibilityChange && { onLineVisibilityChange })}
        {...(timeframes && { timeframes })}
        {...(title && { title })}
        {...(subtitle && { subtitle })}
        {...(height && { height })}
        {...(xAxisFormatter && { xAxisFormatter })}
        {...(yAxisFormatter && { yAxisFormatter })}
        {...(tooltipFormatter && { tooltipFormatter })}
        {...(yAxisLabel && { yAxisLabel })}
      />
    </div>
  )
}

// Default leverage token story with weETH comparison
const LeverageTokenWrapper = () => {
  const data = generateLeverageTokenData(365, 2456) // Generate 1 year of data
  const chartLines: Array<ChartLine> = [
    {
      key: 'weethPrice',
      name: 'weETH Price',
      color: '#10B981',
      dataKey: 'weethPrice',
    },
    {
      key: 'leverageTokenPrice',
      name: 'Leverage Token Price',
      color: '#A16CFE',
      dataKey: 'leverageTokenPrice',
    },
  ]

  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    weethPrice: true,
    leverageTokenPrice: true,
  })

  const handleLineVisibilityChange = (lineKey: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }))
  }

  return (
    <LeverageTokenChartWrapper
      data={data}
      chartLines={chartLines}
      visibleLines={visibleLines}
      onLineVisibilityChange={handleLineVisibilityChange}
      title="Leverage Token Price History"
      subtitle="Token price vs underlying weETH asset"
      yAxisLabel="Price (USD)"
      height={400}
      timeframes={['1H', '1D', '1W', '1M', '3M', '1Y']}
      xAxisFormatter={(value: any) => new Date(value).toLocaleDateString()}
      yAxisFormatter={(value: any) => `$${Number(value).toFixed(2)}`}
      tooltipFormatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name || 'Price']}
    />
  )
}

export const Default: Story = {
  render: () => <LeverageTokenWrapper />,
}
