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

    // Get collateral asset price in USD from CoinGecko (like old app)
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

    const rawTimestamp = Number(state.timestamp)
    const stateTimestamp = rawTimestamp > 4102444800 ? rawTimestamp / 1000000 : rawTimestamp

    // Validate timestamp
    if (Number.isNaN(stateTimestamp) || stateTimestamp <= 0 || stateTimestamp > 4102444800) {
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

    for (const [, states] of leverageTokenStates.entries()) {
      for (const state of states) {
        try {
          // Subgraph timestamps are typically in seconds, not microseconds
          // Let's check if we need to convert by looking at the timestamp value
          const rawTimestamp = Number(state.timestamp)

          // If timestamp is very large (> year 2100), it's likely in microseconds
          // If timestamp is reasonable (< year 2100), it's likely in seconds
          const timestamp = rawTimestamp > 4102444800 ? rawTimestamp / 1000000 : rawTimestamp

          // Validate the timestamp is reasonable (not NaN, not too far in past/future)
          if (!Number.isNaN(timestamp) && timestamp > 0 && timestamp < 4102444800) {
            allTimestamps.add(timestamp)
          } else {
          }
        } catch {}
      }
    }

    // Convert to array and sort
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    if (sortedTimestamps.length === 0) {
      return []
    }

    // Filter timestamps based on timeframe
    const now = Date.now() / 1000 // Current timestamp in seconds
    const timeframeSeconds = _getTimeframeSeconds(timeframe)
    const startTime = now - timeframeSeconds

    const filteredTimestamps = sortedTimestamps.filter((ts) => ts >= startTime)

    if (filteredTimestamps.length === 0) {
      return []
    }

    // For 7D timeframe, we want one point per day for the last 7 days
    // For other timeframes, we can sample more intelligently
    let sampledTimestamps: Array<number>

    if (timeframe === '7D') {
      // For 7D, get the last 7 days of data (one per day)
      sampledTimestamps = filteredTimestamps.slice(-7)
    } else {
      // For other timeframes, use the sampling logic
      sampledTimestamps = _sampleTimestampsForTimeframe(filteredTimestamps, timeframe)
    }

    // Generate data points
    const dataPoints: Array<PortfolioDataPoint> = []

    for (const timestamp of sampledTimestamps) {
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
 * Sample timestamps to get evenly distributed data points for chart display
 */
function _sampleTimestampsForTimeframe(
  timestamps: Array<number>,
  timeframe: '7D' | '30D' | '90D' | '1Y',
): Array<number> {
  if (timestamps.length <= 10) {
    // If we have 10 or fewer timestamps, return all of them
    return timestamps
  }

  // Determine sampling interval based on timeframe
  let maxPoints: number
  switch (timeframe) {
    case '7D':
      maxPoints = 7 // One point per day
      break
    case '30D':
      maxPoints = 15 // Allow more points for 30D to show more data
      break
    case '90D':
      maxPoints = 20 // Allow more points for 90D
      break
    case '1Y':
      maxPoints = 24 // Allow more points for 1Y (2 per month)
      break
    default:
      maxPoints = 15
  }

  if (timestamps.length <= maxPoints) {
    return timestamps
  }

  // Group timestamps by day to avoid multiple points on the same day
  const timestampsByDay = new Map<string, number>()

  for (const timestamp of timestamps) {
    const date = new Date(timestamp * 1000)

    // Use UTC date to avoid timezone issues
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const dayKey = `${year}-${month}-${day}` // YYYY-MM-DD format in UTC

    // Daily grouping logic - keeps latest timestamp for each day

    // Keep the latest timestamp for each day
    const existingTimestamp = timestampsByDay.get(dayKey)
    if (!timestampsByDay.has(dayKey) || (existingTimestamp && existingTimestamp < timestamp)) {
      timestampsByDay.set(dayKey, timestamp)
    }
  }

  const uniqueDailyTimestamps = Array.from(timestampsByDay.values()).sort((a, b) => a - b)

  // If we have a reasonable number of unique daily timestamps, return all of them
  // This ensures we don't lose any data points unnecessarily
  if (uniqueDailyTimestamps.length <= maxPoints) {
    return uniqueDailyTimestamps
  }

  // Sample evenly distributed timestamps from the unique daily ones
  const step = Math.floor(uniqueDailyTimestamps.length / maxPoints)
  const sampled: Array<number> = []

  // Always include the first timestamp
  const firstTimestamp = uniqueDailyTimestamps[0]
  if (firstTimestamp !== undefined) {
    sampled.push(firstTimestamp)
  }

  // Sample evenly distributed points
  for (let i = step; i < uniqueDailyTimestamps.length - 1; i += step) {
    const timestamp = uniqueDailyTimestamps[i]
    if (timestamp !== undefined) {
      sampled.push(timestamp)
    }
    if (sampled.length >= maxPoints - 1) break // Leave room for the last timestamp
  }

  // Always include the last timestamp
  const lastTimestamp = uniqueDailyTimestamps[uniqueDailyTimestamps.length - 1]
  if (lastTimestamp !== undefined && sampled[sampled.length - 1] !== lastTimestamp) {
    sampled.push(lastTimestamp)
  }

  return sampled
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

  // Ensure the date is valid
  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date'
  }

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
