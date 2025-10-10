import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type {
  PortfolioDataPoint,
  PortfolioPerformanceChartProps,
} from '../../../features/portfolio/components/portfolio-performance-chart'
import { PortfolioPerformanceChart } from '../../../features/portfolio/components/portfolio-performance-chart'

const meta: Meta<typeof PortfolioPerformanceChart> = {
  title: 'Features/Portfolio/PerformanceChart',
  component: PortfolioPerformanceChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock portfolio data generator
const generatePortfolioData = (days: number = 30): Array<PortfolioDataPoint> => {
  const baseValue = 61829
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))

    // Start from 0 and gradually increase
    const progress = i / (days - 1) // 0 to 1
    const baseProgress = progress * baseValue

    // Add some variation on top of the base progression
    const variation = Math.sin(i * 0.3) * 0.02 + (Math.random() - 0.5) * 0.01
    const value = baseProgress * (1 + variation)

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(Math.max(0, value)), // Ensure value doesn't go below 0
      earnings: Math.round(((value * 0.08) / 365) * (i + 1)), // 8% APY simulation
    }
  })
}

// Wrapper component to handle state
const PortfolioPerformanceChartWrapper = ({
  data,
  timeframes,
  title,
  height,
  gradientColors,
  strokeColor,
  yAxisLabel,
  tooltipFormatter,
  yAxisFormatter,
}: Pick<
  PortfolioPerformanceChartProps,
  | 'data'
  | 'timeframes'
  | 'title'
  | 'height'
  | 'gradientColors'
  | 'strokeColor'
  | 'yAxisLabel'
  | 'tooltipFormatter'
  | 'yAxisFormatter'
>) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')

  // Filter data based on selected timeframe
  const getFilteredData = (timeframe: string) => {
    let daysToShow: number

    switch (timeframe) {
      case '7D':
        daysToShow = 7
        break
      case '30D':
        daysToShow = 30
        break
      case '90D':
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
      <PortfolioPerformanceChart
        data={filteredData}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
        {...(timeframes && { timeframes })}
        {...(title && { title })}
        {...(height && { height })}
        {...(gradientColors && { gradientColors })}
        {...(strokeColor && { strokeColor })}
        {...(yAxisLabel && { yAxisLabel })}
        {...(tooltipFormatter && { tooltipFormatter })}
        {...(yAxisFormatter && { yAxisFormatter })}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => {
    const data = generatePortfolioData(365) // Generate 1 year of data
    return (
      <PortfolioPerformanceChartWrapper
        data={data}
        title="Portfolio Performance"
        height={320}
        gradientColors={{ start: '#A16CFE', end: '#A16CFE' }}
        strokeColor="#A16CFE"
        yAxisLabel="Portfolio Value ($)"
        tooltipFormatter={(value) => [
          `$${Number(value).toLocaleString('en-US')}`,
          'Portfolio Value',
        ]}
        yAxisFormatter={(value) => {
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(0)}M`
          } else if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`
          }
          return value.toFixed(0)
        }}
      />
    )
  },
}
