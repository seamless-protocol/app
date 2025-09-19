import { 
  USER_POSITIONS_QUERY,
  LEVERAGE_TOKEN_STATE_HISTORY_QUERY
} from '../queries/portfolio'
import type {
  UserPositionsResponse,
  LeverageTokenStateHistoryResponse,
  LeverageTokenState,
  UserPosition,
  User
} from '../types/portfolio'
import { graphqlRequest, getSupportedChainIds } from '../utils'

/**
 * Fetch user positions across all supported chains
 */
export async function fetchUserPositions(
  userAddress: string,
): Promise<UserPositionsResponse> {
  // Get all supported chain IDs from configuration
  const supportedChains = getSupportedChainIds()
  
  const allPositions: UserPosition[] = []
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
      console.warn(`Failed to fetch user positions from chain ${chainId}:`, error)
      // Continue with other chains
    }
  }

  return {
    user: user ? { ...user, positions: allPositions } : null
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
      skip
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
): Promise<LeverageTokenState[]> {
  const supportedChains = getSupportedChainIds()
  const allStates: LeverageTokenState[] = []

  // Fetch from all supported chains
  for (const chainId of supportedChains) {
    try {
      let skip = 0
      const batchSize = 1000

      while (skip < maxRecords) {
        const result = await fetchLeverageTokenStateHistory(
          leverageTokenAddress,
          chainId,
          batchSize,
          skip
        )

        if (!result.leverageToken?.stateHistory) {
          break
        }

        const statesWithTokenAddress = result.leverageToken.stateHistory.map(state => ({
          ...state,
          leverageToken: result.leverageToken!.id
        }))

        allStates.push(...statesWithTokenAddress)

        // If we got less than batchSize, we've reached the end
        if (result.leverageToken.stateHistory.length < batchSize) {
          break
        }

        skip += batchSize
      }
    } catch (error) {
      console.warn(`Failed to fetch state history for token ${leverageTokenAddress} from chain ${chainId}:`, error)
      // Continue with other chains
    }
  }

  return allStates
}

