import { createLogger } from '@/lib/logger'
import {
  BALANCE_BASELINE_BEFORE_WINDOW_QUERY,
  BALANCE_HISTORY_QUERY,
  LEVERAGE_TOKEN_STATE_HISTORY_QUERY,
  USER_POSITIONS_QUERY,
} from '../queries/portfolio'
import type {
  BalanceChange,
  BalanceHistoryResponse,
  LeverageTokenState,
  LeverageTokenStateHistoryResponse,
  User,
  UserPosition,
  UserPositionsResponse,
} from '../types/portfolio'
import { getSupportedChainIds, graphqlRequest } from '../utils'

const logger = createLogger('portfolio-fetcher')

/**
 * Fetch user positions across all supported chains
 */
export async function fetchUserPositions(userAddress: string): Promise<UserPositionsResponse> {
  // Get all supported chain IDs from configuration
  const supportedChains = getSupportedChainIds()

  const allPositions: Array<UserPosition> = []
  let user: User | null = null

  // Fetch from all supported chains
  for (const chainId of supportedChains) {
    try {
      const result = await graphqlRequest<UserPositionsResponse>(chainId, {
        query: USER_POSITIONS_QUERY,
        variables: { userAddress: userAddress.toLowerCase() },
      })

      if (result?.user?.positions) {
        allPositions.push(...result.user.positions)
        if (!user) {
          user = result.user
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch user positions from chain', { chainId, error })
      // Continue with other chains
    }
  }

  return {
    user: user ? { ...user, positions: allPositions } : null,
  }
}

/**
 * Fetch leverage token state history with pagination
 */
export async function fetchLeverageTokenStateHistory(
  leverageTokenAddress: string,
  chainId: number,
  first: number = 1000,
  skip: number = 0,
): Promise<LeverageTokenStateHistoryResponse> {
  const result = await graphqlRequest<LeverageTokenStateHistoryResponse>(chainId, {
    query: LEVERAGE_TOKEN_STATE_HISTORY_QUERY,
    variables: {
      leverageTokenAddress: leverageTokenAddress.toLowerCase(),
      first,
      skip,
    },
  })

  return result || { leverageToken: null }
}

/**
 * Fetch all leverage token state history with pagination across all supported chains
 */
export async function fetchAllLeverageTokenStateHistory(
  leverageTokenAddress: string,
  maxRecords: number = 15000,
): Promise<Array<LeverageTokenState>> {
  const supportedChains = getSupportedChainIds()
  const allStates: Array<LeverageTokenState> = []

  // Fetch from all supported chains
  for (const chainId of supportedChains) {
    try {
      let skip = 0
      const batchSize = 1000
      const chainStates: Array<LeverageTokenState> = []

      while (skip < maxRecords) {
        const result = await fetchLeverageTokenStateHistory(
          leverageTokenAddress,
          chainId,
          batchSize,
          skip,
        )

        if (!result.leverageToken?.stateHistory) {
          break
        }

        const leverageToken = result.leverageToken
        const statesWithTokenAddress = leverageToken.stateHistory.map((state) => ({
          ...state,
          leverageToken: leverageToken.id,
        }))

        chainStates.push(...statesWithTokenAddress)

        // If we got less than batchSize, we've reached the end
        if (result.leverageToken.stateHistory.length < batchSize) {
          break
        }

        skip += batchSize
      }

      allStates.push(...chainStates)
    } catch (error) {
      logger.warn('Failed to fetch state history for token from chain', {
        leverageTokenAddress,
        chainId,
        error,
      })
      // Continue with other chains
    }
  }

  return allStates
}

/**
 * Fetch balance history for a user across all chains
 * Returns balance changes for the user's positions within the given timeframe
 */
export async function fetchUserBalanceHistory(
  userAddress: string,
  tokenAddresses: Array<string>,
  fromTimestamp: number,
  toTimestamp: number,
  maxRecords: number = 10000,
): Promise<Array<BalanceChange>> {
  const supportedChains = getSupportedChainIds()
  const allBalanceChanges: Array<BalanceChange> = []

  // Convert timestamps from seconds to microseconds (subgraph uses microseconds)
  const fromMicroseconds = fromTimestamp * 1000000
  const toMicroseconds = toTimestamp * 1000000

  // Fetch from all supported chains
  for (const chainId of supportedChains) {
    try {
      let skip = 0
      const batchSize = 1000
      const chainBalanceChanges: Array<BalanceChange> = []

      while (skip < maxRecords) {
        const result = await graphqlRequest<BalanceHistoryResponse>(chainId, {
          query: BALANCE_HISTORY_QUERY,
          variables: {
            user: userAddress.toLowerCase(),
            tokens: tokenAddresses.map((addr) => addr.toLowerCase()),
            from: fromMicroseconds.toString(),
            to: toMicroseconds.toString(),
            first: batchSize,
            skip,
          },
        })

        if (
          !result?.leverageTokenBalanceChanges ||
          result.leverageTokenBalanceChanges.length === 0
        ) {
          break
        }

        chainBalanceChanges.push(...result.leverageTokenBalanceChanges)

        // If we got less than batchSize, we've reached the end
        if (result.leverageTokenBalanceChanges.length < batchSize) {
          break
        }

        skip += batchSize
      }

      allBalanceChanges.push(...chainBalanceChanges)
    } catch (error) {
      logger.warn('Failed to fetch balance history from chain', {
        userAddress,
        chainId,
        error,
      })
      // Continue with other chains
    }
  }

  return allBalanceChanges
}

/**
 * Fetch the most recent balance change BEFORE the window start for each token.
 * This provides a baseline so balances at the start of the timeframe are non-zero
 * when the user minted before the window and made no changes within it.
 *
 * Returns at most one event per token per chain.
 */
export async function fetchUserBalanceBaselineBeforeWindow(
  userAddress: string,
  tokenAddresses: Array<string>,
  fromTimestamp: number,
  maxRecords: number = 10000,
): Promise<Array<BalanceChange>> {
  const supportedChains = getSupportedChainIds()
  const allBaselineChanges: Array<BalanceChange> = []

  // Convert seconds -> microseconds for subgraph
  const fromMicroseconds = fromTimestamp * 1_000_000

  for (const chainId of supportedChains) {
    try {
      const wanted = new Set(tokenAddresses.map((a) => a.toLowerCase()))
      const foundPerToken = new Map<string, BalanceChange>()

      let skip = 0
      const batchSize = 1000

      while (skip < maxRecords) {
        const result = await graphqlRequest<BalanceHistoryResponse>(chainId, {
          query: BALANCE_BASELINE_BEFORE_WINDOW_QUERY,
          variables: {
            user: userAddress.toLowerCase(),
            tokens: tokenAddresses.map((a) => a.toLowerCase()),
            from: fromMicroseconds.toString(),
            first: batchSize,
            skip,
          },
        })

        const changes = result?.leverageTokenBalanceChanges || []
        if (changes.length === 0) break

        // Results come in desc order by timestamp. Record first occurrence per token.
        for (const change of changes) {
          const tokenAddr = change.position.leverageToken.id.toLowerCase()
          if (!wanted.has(tokenAddr)) continue
          if (!foundPerToken.has(tokenAddr)) {
            foundPerToken.set(tokenAddr, change)
          }
        }

        // If we've found a baseline for all requested tokens, stop.
        if (foundPerToken.size >= wanted.size) break

        if (changes.length < batchSize) break
        skip += batchSize
      }

      for (const change of foundPerToken.values()) {
        allBaselineChanges.push(change)
      }
    } catch (error) {
      logger.warn('Failed to fetch baseline balance before window from chain', {
        userAddress,
        chainId,
        error,
      })
      // Continue with other chains
    }
  }

  return allBaselineChanges
}
