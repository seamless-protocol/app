import { formatUnits } from 'viem'
import type { BalanceChange, LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'

/**
 * Get the balance of a token at a specific timestamp from balance history
 * Returns the most recent balance change before or at the target timestamp
 */
function _getBalanceAtTimestamp(
  tokenAddress: string,
  timestamp: number,
  balanceChanges: Array<BalanceChange>,
): bigint {
  // Filter balance changes for this token
  const tokenBalanceChanges = balanceChanges.filter(
    (change) => change.position.leverageToken.id.toLowerCase() === tokenAddress.toLowerCase(),
  )

  if (tokenBalanceChanges.length === 0) {
    return 0n
  }

  // Find the most recent balance change before or at the target timestamp
  // Balance changes are already sorted by timestamp (ascending) from the query
  let mostRecentBalance = 0n

  for (const change of tokenBalanceChanges) {
    // Subgraph timestamps are in microseconds, convert to seconds
    const changeTimestamp = Number(change.timestamp) / 1000000

    // If this change is after the target timestamp, we've gone too far
    if (changeTimestamp > timestamp) {
      break
    }

    // This change is before or at the target timestamp, use it
    mostRecentBalance = BigInt(change.amount)
  }

  return mostRecentBalance
}

/**
 * Calculate portfolio value at a specific timestamp using historical balances
 */
function _calculatePortfolioValueAtTimestamp(
  timestamp: number,
  userPositions: Array<UserPosition>,
  leverageTokenStates: Map<string, Array<LeverageTokenState>>,
  balanceChanges: Array<BalanceChange>,
  getUsdPriceAt: (chainId: number, address: string, tsSec: number) => number | undefined,
  collateralDecimalsByLeverageToken: Record<string, number>,
  chainIdByLeverageToken: Record<string, number>,
  spotUsdPrices?: Record<string, number>,
): number {
  let totalValue = 0

  for (const position of userPositions) {
    // Get the historical balance at this timestamp
    const balance = _getBalanceAtTimestamp(position.leverageToken.id, timestamp, balanceChanges)

    // Skip zero balance positions
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

    // Calculate position value: balance * equity per token (using collateral asset)
    const equityPerToken = BigInt(closestState.equityPerTokenInCollateral)
    const positionValue = (balance * equityPerToken) / BigInt(1e18)

    // Convert to collateral asset units using actual decimals
    const leverageTokenAddress = position.leverageToken.id.toLowerCase()
    const collateralDecimals = collateralDecimalsByLeverageToken[leverageTokenAddress] ?? 18
    const positionValueInCollateralAsset = Number(formatUnits(positionValue, collateralDecimals))

    // Get collateral asset price in USD
    const collateralAssetAddress =
      position.leverageToken.lendingAdapter.collateralAsset.toLowerCase()
    const chainId = chainIdByLeverageToken[leverageTokenAddress] ?? 1
    const historicalUsd = getUsdPriceAt(chainId, collateralAssetAddress, timestamp)
    const collateralAssetPriceUsd =
      historicalUsd ?? (spotUsdPrices ? spotUsdPrices[collateralAssetAddress] : undefined)
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
 * Generate portfolio performance data points from historical data with balance history
 */
/**
 * Pure accessor for historical USD prices.
 *
 * - Implementations must perform an in-memory lookup (no network) for a given
 *   `(chainId, collateralAddress, timestampSec)` and return the nearest-prior USD.
 * - Return `undefined` when no historical price is available (the caller may fall back to spot).
 */
export type GetUsdPriceAt = (chainId: number, address: string, tsSec: number) => number | undefined

/**
 * Generate portfolio performance datapoints on a regular time grid for the selected timeframe.
 *
 * Inputs
 * - `userPositions`, `leverageTokenStates`, `balanceChanges`: subgraph-derived data (with baseline
 *   events included in `balanceChanges` for timestamp_lt).
 * - `getUsdPriceAt`: nearest-prior USD accessor (pure; no network).
 * - `collateralDecimalsByLeverageToken`: map of leverage token address → collateral decimals.
 * - `chainIdByLeverageToken`: map of leverage token address → chainId (for historical pricing lookup).
 * - `spotUsdPrices`: optional spot USD map used only as a fallback when historical USD is missing.
 */
export function generatePortfolioPerformanceData(
  userPositions: Array<UserPosition>,
  leverageTokenStates: Map<string, Array<LeverageTokenState>>,
  balanceChanges: Array<BalanceChange>,
  timeframe: Timeframe,
  getUsdPriceAt: GetUsdPriceAt,
  collateralDecimalsByLeverageToken: Record<string, number>,
  chainIdByLeverageToken: Record<string, number>,
  spotUsdPrices?: Record<string, number>,
): Array<PortfolioDataPoint> {
  if (userPositions.length === 0 || leverageTokenStates.size === 0) {
    return []
  }

  const nowSec = Math.floor(Date.now() / 1000)
  const timeline = _buildTimeline(timeframe, nowSec)
  if (timeline.length === 0) return []

  return timeline.map((ts) =>
    _toPortfolioDataPoint(
      ts,
      userPositions,
      leverageTokenStates,
      balanceChanges,
      getUsdPriceAt,
      collateralDecimalsByLeverageToken,
      chainIdByLeverageToken,
      spotUsdPrices,
    ),
  )
}

/**
 * Build a regular, ascending timeline for the selected timeframe.
 */
function _buildTimeline(timeframe: Timeframe, nowSec: number): Array<number> {
  const startSec = nowSec - _getTimeframeSeconds(timeframe)
  const stepSec = _getTimeStepSeconds(timeframe)

  const out: Array<number> = [startSec]
  for (let t = startSec + stepSec; t < nowSec; t += stepSec) out.push(t)
  out.push(nowSec)
  return out
}

/**
 * Compute the portfolio value for a given timestamp and wrap into a data point.
 */
function _toPortfolioDataPoint(
  timestamp: number,
  userPositions: Array<UserPosition>,
  leverageTokenStates: Map<string, Array<LeverageTokenState>>,
  balanceChanges: Array<BalanceChange>,
  getUsdPriceAt: GetUsdPriceAt,
  collateralDecimalsByLeverageToken: Record<string, number>,
  chainIdByLeverageToken: Record<string, number>,
  spotUsdPrices?: Record<string, number>,
): PortfolioDataPoint {
  const value = _calculatePortfolioValueAtTimestamp(
    timestamp,
    userPositions,
    leverageTokenStates,
    balanceChanges,
    getUsdPriceAt,
    collateralDecimalsByLeverageToken,
    chainIdByLeverageToken,
    spotUsdPrices,
  )

  return {
    date: new Date(timestamp * 1000).toISOString(),
    value,
    earnings: 0,
    timestamp,
  }
}

/**
 * Get timeframe in seconds
 */
function _getTimeframeSeconds(timeframe: Timeframe): number {
  return TIMEFRAME_SECONDS[timeframe] ?? TIMEFRAME_SECONDS['30D']
}

/**
 * Choose a reasonable sampling interval for the chart timeline
 * to keep the number of points small and rendering snappy.
 */
function _getTimeStepSeconds(timeframe: Timeframe): number {
  return TIMEFRAME_STEP_SECONDS[timeframe] ?? TIMEFRAME_STEP_SECONDS['30D']
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
type Timeframe = '7D' | '30D' | '90D' | '1Y'

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '7D': 7 * 24 * 60 * 60,
  '30D': 30 * 24 * 60 * 60,
  '90D': 90 * 24 * 60 * 60,
  '1Y': 365 * 24 * 60 * 60,
}

const TIMEFRAME_STEP_SECONDS: Record<Timeframe, number> = {
  '7D': 24 * 60 * 60, // 1 day
  '30D': 24 * 60 * 60, // 1 day
  '90D': 24 * 60 * 60, // 1 day
  '1Y': 7 * 24 * 60 * 60, // 1 week
}
