import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { APYBreakdown, type APYBreakdownData } from '../../../src/components/APYBreakdown'

describe('APYBreakdown', () => {
  const mockData: APYBreakdownData = {
    stakingYield: 5.2,
    restakingYield: 2.1,
    borrowRate: -1.5,
    rewardsAPR: 0.8,
    points: 6.0,
    totalAPY: 6.6,
  }

  it('should render all yield components correctly', () => {
    render(<APYBreakdown data={mockData} />)

    // Check that all components are rendered
    expect(screen.getByText('Staking Yield:')).toBeInTheDocument()
    expect(screen.getByText('Restaking Yield:')).toBeInTheDocument()
    expect(screen.getByText('Borrow Rate:')).toBeInTheDocument()
    expect(screen.getByText('Rewards APY:')).toBeInTheDocument()
    expect(screen.getByText('Points:')).toBeInTheDocument()
    expect(screen.getByText('Total APY:')).toBeInTheDocument()
  })

  it('should display values with correct formatting', () => {
    render(<APYBreakdown data={mockData} />)

    // Check that values are displayed with proper formatting
    expect(screen.getByText('+520.00%')).toBeInTheDocument() // Staking Yield
    expect(screen.getByText('+210.00%')).toBeInTheDocument() // Restaking Yield
    expect(screen.getByText('-150.00%')).toBeInTheDocument() // Borrow Rate (negative)
    expect(screen.getByText('+80.00%')).toBeInTheDocument() // Rewards APY
    expect(screen.getByText('6 x')).toBeInTheDocument() // Points
    expect(screen.getByText('+660.00%')).toBeInTheDocument() // Total APY
  })

  it('should render in compact mode', () => {
    render(<APYBreakdown data={mockData} compact />)

    // Component should still render all elements
    expect(screen.getByText('APY Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Staking Yield:')).toBeInTheDocument()
  })
})
