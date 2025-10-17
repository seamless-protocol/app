import { formatUnits } from 'viem'
import type { LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'

/**
 * Calculate portfolio value at a specific timestamp
 */
function _calculatePortfolioValueAtTimestamp(
  timestamp: number,
  userPositions: Array<UserPosition>,
  leverageTokenStates: Map<string, Array<LeverageTokenState>>,
  usdPrices: Record<string, number>,
): number {
  let totalValue = 0

  for (const position of userPositions) {
    const balance = BigInt(position.balance)

    // Skip zero balance positions (redeemed tokens)
    if (balance === 0n) {
      continue
    }

    const tokenStates = leverageTokenStates.get(position.leverageToken.id)
    if (!tokenStates) {
      continue
    }

    // Find the closest state to the timestamp
    const closestState = _findClosestStateByTimestamp(tokenStates, timestamp)
    if (!closestState) {
      continue
    }

    // Calculate position value: balance * equity per token (using collateral asset like old app)
    const equityPerToken = BigInt(closestState.equityPerTokenInCollateral)
    const positionValue = (balance * equityPerToken) / BigInt(1e18)

    // The positionValue is in collateral asset units, convert from wei to collateral asset
    // Use 18 decimals as fallback since we don't have access to token config here
    const positionValueInCollateralAsset = Number(formatUnits(positionValue, 18))

    // Get collateral asset price in USD
    const collateralAssetAddress =
      position.leverageToken.lendingAdapter.collateralAsset.toLowerCase()
    const collateralAssetPriceUsd = usdPrices[collateralAssetAddress]
    const positionValueInUSD = collateralAssetPriceUsd
      ? positionValueInCollateralAsset * collateralAssetPriceUsd
      : 0

    totalValue += positionValueInUSD
  }

  return totalValue
}

/**
 * Find the closest state by timestamp using binary search for O(log N) performance
 */
function _findClosestStateByTimestamp(
  states: Array<LeverageTokenState>,
  targetTimestamp: number,
): LeverageTokenState | null {
  if (states.length === 0) return null

  // Sort states by timestamp (ascending)
  const sortedStates = [...states].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

  // Binary search for the closest state that's not after the target timestamp
  let left = 0
  let right = sortedStates.length - 1
  let closestState: LeverageTokenState | null = null

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const state = sortedStates[mid]
    if (!state) break

    // Subgraph timestamps are in microseconds, convert to seconds
    const stateTimestamp = Number(state.timestamp) / 1000000

    // Validate timestamp
    if (Number.isNaN(stateTimestamp) || stateTimestamp <= 0) {
      continue // Skip invalid timestamps
    }

    if (stateTimestamp <= targetTimestamp) {
      closestState = state
      left = mid + 1 // Look for a later state that's still <= target
    } else {
      right = mid - 1 // Look for an earlier state
    }
  }

  return closestState
}

/**
 * Calculate current portfolio value and performance metrics from user positions
 */
export function calculatePortfolioMetrics(
  userPositions: Array<UserPosition>,
  leverageTokenStates: Map<string, Array<LeverageTokenState>>,
  usdPrices: Record<string, number>,
): {
  totalValue: number
  totalDeposited: number
  changeAmount: number
  changePercent: number
} {
  if (userPositions.length === 0 || leverageTokenStates.size === 0) {
    return {
      totalValue: 0,
      totalDeposited: 0,
      changeAmount: 0,
      changePercent: 0,
    }
  }

  let totalValue = 0
  let totalDeposited = 0
  const now = Date.now() / 1000 // Current timestamp in seconds

  for (const position of userPositions) {
    const balance = BigInt(position.balance)

    // Skip zero balance positions (redeemed tokens)
    if (balance === 0n) {
      continue
    }

    const tokenStates = leverageTokenStates.get(position.leverageToken.id)
    if (!tokenStates || tokenStates.length === 0) {
      continue
    }

    // Find the most recent state (closest to now)
    const mostRecentState = _findClosestStateByTimestamp(tokenStates, now)
    if (!mostRecentState) {
      continue
    }

    // Calculate current position value: balance * equity per token (using collateral asset like old app)
    const equityPerToken = BigInt(mostRecentState.equityPerTokenInCollateral)
    const positionValue = (balance * equityPerToken) / BigInt(1e18)

    // Convert from wei to collateral asset units
    // Use 18 decimals as fallback since we don't have access to token config here
    const positionValueInCollateralAsset = Number(formatUnits(positionValue, 18))

    // Get collateral asset price in USD (like old app)
    const collateralAssetAddress =
      position.leverageToken.lendingAdapter.collateralAsset.toLowerCase()
    const collateralAssetPriceUsd = usdPrices[collateralAssetAddress]
    const positionValueInUSD = collateralAssetPriceUsd
      ? positionValueInCollateralAsset * collateralAssetPriceUsd
      : 0

    totalValue += positionValueInUSD

    // Calculate deposited amount (what user originally put in)
    // This uses the totalEquityDepositedInCollateral field from the position (like old app)
    const depositedInCollateral = BigInt(position.totalEquityDepositedInCollateral || '0')
    // Use 18 decimals as fallback since we don't have access to token config here
    const depositedInCollateralAsset = Number(formatUnits(depositedInCollateral, 18))
    const depositedInUSD = collateralAssetPriceUsd
      ? depositedInCollateralAsset * collateralAssetPriceUsd
      : 0

    totalDeposited += depositedInUSD
  }

  // Calculate performance metrics
  const changeAmount = totalValue - totalDeposited
  const changePercent = totalDeposited > 0 ? (changeAmount / totalDeposited) * 100 : 0

  return {
    totalValue,
    totalDeposited,
    changeAmount,
    changePercent,
  }
}

/**
 * Generate portfolio performance data points from historical data
 */
export function generatePortfolioPerformanceData(
  userPositions: Array<UserPosition>,
  leverageTokenStates: Map<string, Array<LeverageTokenState>>,
  timeframe: '7D' | '30D' | '90D' | '1Y',
  usdPrices: Record<string, number>,
): Array<PortfolioDataPoint> {
  try {
    if (userPositions.length === 0 || leverageTokenStates.size === 0) {
      return []
    }

    // Get all unique timestamps from all leverage tokens
    const allTimestamps = new Set<number>()

    for (const states of leverageTokenStates.values()) {
      for (const state of states) {
        // Subgraph timestamps are in microseconds, convert to seconds
        const timestamp = Number(state.timestamp) / 1000000

        // Validate the timestamp is reasonable (not NaN, not in the future)
        if (!Number.isNaN(timestamp) && timestamp > 0 && timestamp <= Date.now() / 1000) {
          allTimestamps.add(timestamp)
        }
      }
    }

    // Convert to array and sort
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    if (sortedTimestamps.length === 0) {
      return []
    }

    // Filter by timeframe
    const now = Date.now() / 1000
    const timeframeSeconds = _getTimeframeSeconds(timeframe)
    const startTime = now - timeframeSeconds
    const filteredTimestamps = sortedTimestamps.filter((ts) => ts >= startTime)

    if (filteredTimestamps.length === 0) {
      return []
    }

    // Generate data points
    const dataPoints: Array<PortfolioDataPoint> = []

    for (const timestamp of filteredTimestamps) {
      const portfolioValue = _calculatePortfolioValueAtTimestamp(
        timestamp,
        userPositions,
        leverageTokenStates,
        usdPrices,
      )

      if (portfolioValue > 0) {
        const formattedDate = _formatTimestampForChart(timestamp, timeframe)

        // Check if we already have a data point for this formatted date
        const existingDataPoint = dataPoints.find((dp) => dp.date === formattedDate)
        if (existingDataPoint) {
          // Keep the later timestamp
          if (existingDataPoint.timestamp && timestamp > existingDataPoint.timestamp) {
            // Replace the existing data point
            const index = dataPoints.indexOf(existingDataPoint)
            dataPoints[index] = {
              date: formattedDate,
              value: portfolioValue,
              earnings: 0,
              timestamp,
            }
          }
          // If the new timestamp is earlier, skip it
        } else {
          dataPoints.push({
            date: formattedDate,
            value: portfolioValue,
            earnings: 0, // Will be calculated separately if needed
            timestamp, // Store original timestamp for sorting
          })
        }
      }
    }

    // Sort by original timestamp ascending for chart display
    return dataPoints.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
  } catch (error) {
    console.error('❌ [Portfolio Calculations] Error generating performance data:', error)
    return []
  }
}

/**
 * Get timeframe in seconds
 */
function _getTimeframeSeconds(timeframe: '7D' | '30D' | '90D' | '1Y'): number {
  switch (timeframe) {
    case '7D':
      return 7 * 24 * 60 * 60
    case '30D':
      return 30 * 24 * 60 * 60
    case '90D':
      return 90 * 24 * 60 * 60
    case '1Y':
      return 365 * 24 * 60 * 60
    default:
      return 30 * 24 * 60 * 60
  }
}

/**
 * Format timestamp for chart display
 */
function _formatTimestampForChart(
  timestamp: number,
  timeframe: '7D' | '30D' | '90D' | '1Y',
): string {
  const date = new Date(timestamp * 1000)

  // Use UTC date formatting to avoid timezone issues
  const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()

  switch (timeframe) {
    case '7D':
    case '30D':
      return `${month} ${day}`
    case '90D':
      return `${month} ${day}`
    case '1Y':
      return `${month} ${year}`
    default:
      return `${month} ${day}`
  }
}

/**
 * Group leverage token states by token address
 */
export function groupStatesByToken(
  states: Array<LeverageTokenState>,
): Map<string, Array<LeverageTokenState>> {
  const grouped = new Map<string, Array<LeverageTokenState>>()

  for (const state of states) {
    const tokenAddress = state.leverageToken

    if (!tokenAddress) {
      continue // Skip states without token address
    }

    if (!grouped.has(tokenAddress)) {
      grouped.set(tokenAddress, [])
    }
    grouped.get(tokenAddress)?.push(state)
  }

  return grouped
}
