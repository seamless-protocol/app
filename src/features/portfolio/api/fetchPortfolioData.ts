import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import {
  fetchAllLeverageTokenStateHistory,
  fetchUserPositions,
} from '@/lib/graphql/fetchers/portfolio'
import type { LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import type { Position } from '../components/active-positions'
import { groupStatesByToken } from '../utils/portfolio-calculations'

export interface FetchPortfolioDataResult {
  portfolioData: {
    summary: {
      totalValue: number
      totalEarnings: number
      activePositions: number
      changeAmount: number
      changePercent: number
      averageAPY: number
    }
    positions: Array<Position>
  }
  rawUserPositions: Array<UserPosition>
  leverageTokenStates: Map<string, Array<LeverageTokenState>>
}

export async function fetchPortfolioData(address: string): Promise<FetchPortfolioDataResult> {
  const userPositionsResponse = await fetchUserPositions(address)
  const userPositions = userPositionsResponse.user?.positions ?? []

  // Map raw positions to UI positions (filter out tokens without configs)
  const positions = userPositions
    .map((userPosition) => {
      const leverageTokenAddress = userPosition.leverageToken.id.toLowerCase()
      const tokenConfig = getAllLeverageTokenConfigs().find(
        (config) => config.address.toLowerCase() === leverageTokenAddress,
      )
      if (!tokenConfig) return null

      const collateralAsset = tokenConfig.collateralAsset
      const debtAsset = tokenConfig.debtAsset

      return {
        id: userPosition.id,
        name: tokenConfig?.name || `${collateralAsset.symbol} / ${debtAsset.symbol} Leverage Token`,
        type: 'leverage-token' as const,
        token: collateralAsset.symbol as 'USDC' | 'WETH' | 'weETH',
        currentValue: { amount: '0.00', symbol: 'USD', usdValue: '$0.00' },
        unrealizedGain: { amount: '0.00', symbol: 'USD', percentage: '0.00%' },
        apy: '0.00%',
        collateralAsset: { symbol: collateralAsset.symbol, name: collateralAsset.name },
        debtAsset: { symbol: debtAsset.symbol, name: debtAsset.name },
        leverageTokenAddress: userPosition.leverageToken.id,
      }
    })
    .filter((pos): pos is NonNullable<typeof pos> => pos !== null)

  const leverageTokenAddresses = positions.map((p) => p.leverageTokenAddress)
  const stateHistoryPromises = leverageTokenAddresses.map((tokenAddress) =>
    fetchAllLeverageTokenStateHistory(tokenAddress),
  )
  const stateHistoryResults = await Promise.allSettled(stateHistoryPromises)
  const allStates: Array<LeverageTokenState> = []
  stateHistoryResults.forEach((result) => {
    if (result.status === 'fulfilled') allStates.push(...result.value)
  })
  const groupedStates = groupStatesByToken(allStates)

  return {
    portfolioData: {
      summary: {
        totalValue: 0,
        totalEarnings: 0,
        activePositions: positions.length,
        changeAmount: 0,
        changePercent: 0,
        averageAPY: 0,
      },
      positions,
    },
    rawUserPositions: userPositions,
    leverageTokenStates: groupedStates,
  }
}
