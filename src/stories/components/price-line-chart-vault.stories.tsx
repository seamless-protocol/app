import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { PriceDataPoint, PriceLineChartProps } from '../../components/ui/price-line-chart'
import { PriceLineChart } from '../../components/ui/price-line-chart'

const meta: Meta<typeof PriceLineChart> = {
  title: 'Components/Vault/PricePerformance',
  component: PriceLineChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data generator for vaults with more realistic TVL patterns
const generateVaultData = (days: number = 30, baseTVL: number = 100): Array<PriceDataPoint> => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))

    // Create more realistic vault TVL data with growth trends
    const progress = i / (days - 1) // 0 to 1
    const baseGrowth = 1 + progress * 0.5 // 50% growth over the period

    // Add market volatility and seasonal patterns
    const marketVariation = Math.sin(i * 0.2) * 0.1 + (Math.random() - 0.5) * 0.05
    const seasonalEffect = Math.sin(i * 0.1) * 0.02 // Weekly patterns

    const tvl = baseTVL * baseGrowth * (1 + marketVariation + seasonalEffect)

    // Price data with correlation to TVL
    const priceVariation = Math.sin(i * 0.3) * 0.02 + (Math.random() - 0.5) * 0.01
    const price = 2456 * (1 + priceVariation) * (1 + progress * 0.1) // Price growth correlated with TVL

    return {
      date: date.toISOString().split('T')[0] || '', // YYYY-MM-DD format
      price: Math.round(Math.max(0, price * 100)) / 100,
      tvl: Math.round(Math.max(0, tvl * 100)) / 100,
      weethPrice: Math.round(Math.max(0, price * 100)) / 100,
      leverageTokenPrice: Math.round(Math.max(0, price * 100)) / 100,
    }
  })
}

// Wrapper component to handle state for vaults
const VaultChartWrapper = ({
  data,
  timeframes,
  title,
  subtitle,
  height,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  yAxisLabel,
  dataKey,
  strokeColor,
}: Pick<
  PriceLineChartProps,
  | 'data'
  | 'timeframes'
  | 'title'
  | 'subtitle'
  | 'height'
  | 'xAxisFormatter'
  | 'yAxisFormatter'
  | 'tooltipFormatter'
  | 'yAxisLabel'
  | 'dataKey'
  | 'strokeColor'
>) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M')

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
        daysToShow = 30
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
        chartType="tvl"
        {...(timeframes && { timeframes })}
        {...(title && { title })}
        {...(subtitle && { subtitle })}
        {...(height && { height })}
        {...(xAxisFormatter && { xAxisFormatter })}
        {...(yAxisFormatter && { yAxisFormatter })}
        {...(tooltipFormatter && { tooltipFormatter })}
        {...(yAxisLabel && { yAxisLabel })}
        {...(dataKey && { dataKey })}
        {...(strokeColor && { strokeColor })}
      />
    </div>
  )
}

// Default vault story with TVL focus
const VaultWrapper = () => {
  const data = generateVaultData(365, 100) // Generate 1 year of data with $100M base TVL

  return (
    <VaultChartWrapper
      data={data}
      title="Vault TVL Performance"
      subtitle="Total Value Locked over time"
      yAxisLabel="TVL (Millions USD)"
      dataKey="tvl"
      strokeColor="#10B981"
      tooltipFormatter={(value) => [`$${Number(value).toFixed(2)}M`, 'TVL']}
      yAxisFormatter={(value) => `$${value.toFixed(0)}M`}
    />
  )
}

export const Default: Story = {
  render: () => <VaultWrapper />,
}
