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
 * Find the closest state by timestamp
 */
function _findClosestStateByTimestamp(
  states: Array<LeverageTokenState>,
  targetTimestamp: number,
): LeverageTokenState | null {
  if (states.length === 0) return null

  // Sort states by timestamp (ascending)
  const sortedStates = [...states].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

  // Find the closest state that's not after the target timestamp
  let closestState: LeverageTokenState | null = null
  let closestDiff = Infinity

  for (const state of sortedStates) {
    // Convert microseconds to seconds for comparison (same as in generatePortfolioPerformanceData)
    const stateTimestamp = Number(state.timestamp) / 1000000
    const diff = Math.abs(stateTimestamp - targetTimestamp)

    if (stateTimestamp <= targetTimestamp && diff < closestDiff) {
      closestState = state
      closestDiff = diff
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
  if (userPositions.length === 0 || leverageTokenStates.size === 0) {
    return []
  }

  // Get all unique timestamps from all leverage tokens
  const allTimestamps = new Set<number>()

  for (const states of leverageTokenStates.values()) {
    for (const state of states) {
      // Convert microseconds to seconds (divide by 1,000,000)
      const timestamp = Number(state.timestamp) / 1000000
      allTimestamps.add(timestamp)
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
      dataPoints.push({
        date: _formatTimestampForChart(timestamp, timeframe),
        value: portfolioValue,
        earnings: 0, // Will be calculated separately if needed
      })
    }
  }

  // Sort by timestamp ascending for chart display
  return dataPoints.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })
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

  switch (timeframe) {
    case '7D':
    case '30D':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case '90D':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case '1Y':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
