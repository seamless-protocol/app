import type { LeverageToken } from '@/components/LeverageTokenTable'

export interface APYBreakdownData {
  baseYield: number
  leverageMultiplier: number
  borrowCost: number
  rewardAPY: number
  points: number
  totalAPY: number
}

/**
 * Calculate APY breakdown for a leverage token
 * This function provides consistent APY calculations across components
 */
export function calculateAPYBreakdown(token: LeverageToken): APYBreakdownData {
  // Reward APY calculation based on TVL and reward multiplier
  const rewardAPY = (token.tvl / 1000000) * (token.rewardMultiplier || 0.5)

  // Points calculation based on TVL
  const points = Math.floor(token.tvl / 1000)

  return {
    baseYield: token.baseYield,
    leverageMultiplier: token.leverage,
    borrowCost: -token.borrowRate, // Negative because it's a cost
    rewardAPY,
    points,
    totalAPY: token.apy,
  }
}

/**
 * Get reward APY for display in cards
 */
export function getRewardAPY(token: LeverageToken): number {
  return (token.tvl / 1000000) * (token.rewardMultiplier || 0.5)
}

/**
 * Get points per day for display in cards
 */
export function getPointsPerDay(token: LeverageToken): number {
  return Math.floor(token.tvl / 1000)
}
