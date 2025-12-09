import {
  LEVERAGE_TOKEN_PRICE_COMPARISON_METADATA_QUERY,
  LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY,
  USER_LEVERAGE_TOKEN_POSITION_QUERY,
} from '../queries/leverage-tokens'
import type {
  LeverageTokenPriceComparisonResponse,
  UserLeverageTokenPositionResponse,
} from '../types/leverage-tokens'
import { graphqlRequest } from '../utils'

interface LeverageTokenPriceComparisonMetadataResponse {
  leverageToken: {
    lendingAdapter: {
      oracle: {
        id: string
        decimals: number
      } | null
    } | null
  } | null
}

interface LeverageTokenPriceComparisonCollectionsResponse {
  leverageTokenStateStats_collection: Array<{
    lastEquityPerTokenInDebt: string
    timestamp: string
  }>
  oraclePriceStats_collection: Array<{
    lastPrice: string
    timestamp: string
  }>
}

export async function fetchLeverageTokenPriceComparison(
  address: string,
  chainId: number,
): Promise<LeverageTokenPriceComparisonResponse> {
  const addressLower = address.toLowerCase()

  const metadata = await graphqlRequest<LeverageTokenPriceComparisonMetadataResponse>(chainId, {
    query: LEVERAGE_TOKEN_PRICE_COMPARISON_METADATA_QUERY,
    variables: { address: addressLower },
  })

  const oracle = metadata?.leverageToken?.lendingAdapter?.oracle
  const oracleId = oracle?.id?.toLowerCase()

  if (!oracleId || !oracle?.decimals) {
    return { leverageToken: null }
  }

  const statsResult = await graphqlRequest<LeverageTokenPriceComparisonCollectionsResponse>(
    chainId,
    {
      query: LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY,
      variables: { address: addressLower, oracle: oracleId, first: 1000 },
    },
  )

  const stateHistory =
    statsResult?.leverageTokenStateStats_collection?.map((item) => ({
      equityPerTokenInDebt: item.lastEquityPerTokenInDebt,
      timestamp: item.timestamp,
    })) ?? []

  const priceUpdates =
    statsResult?.oraclePriceStats_collection?.map((item) => ({
      price: item.lastPrice,
      timestamp: item.timestamp,
    })) ?? []

  return {
    leverageToken: {
      stateHistory,
      lendingAdapter: {
        oracle: {
          decimals: oracle?.decimals,
          priceUpdates,
        },
      },
    },
  }
}

export async function fetchUserLeverageTokenPosition(params: {
  userAddress: string
  leverageTokenAddress: string
  chainId: number
}): Promise<UserLeverageTokenPositionResponse> {
  const { userAddress, leverageTokenAddress, chainId } = params

  const result = await graphqlRequest<UserLeverageTokenPositionResponse>(chainId, {
    query: USER_LEVERAGE_TOKEN_POSITION_QUERY,
    variables: {
      userAddress: userAddress.toLowerCase(),
      leverageToken: leverageTokenAddress.toLowerCase(),
    },
  })

  return result || { user: null }
}
