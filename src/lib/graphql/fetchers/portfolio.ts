import { createLogger } from '@/lib/logger'
import {
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
