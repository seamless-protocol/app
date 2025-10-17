import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { createLogger } from '@/lib/logger'

const logger = createLogger('morpho-borrow-apy')

import { lendingAdapterAbi, leverageManagerV2Abi } from '@/lib/contracts'
import { getLeverageManagerAddress, type SupportedChainId } from '@/lib/contracts/addresses'
import { fetchMorphoMarketBorrowRate } from '@/lib/graphql/fetchers/morpho'
import type { BaseBorrowApyData, BorrowApyFetcher } from './types'

/**
 * Fetches the Morpho market ID for a leverage token
 * This function gets the lending adapter from the leverage manager and then
 * fetches the market ID from the lending adapter contract
 */
async function fetchMorphoMarketId(
  tokenAddress: Address,
  chainId: number,
  config: Config,
): Promise<string> {
  try {
    // Step 1: Get leverage token config from LeverageManager
    const managerAddress = getLeverageManagerAddress(chainId)

    if (!managerAddress) {
      throw new Error(`No leverage manager address found for chain ID: ${chainId}`)
    }

    const managerResult = await readContract(config, {
      address: managerAddress,
      abi: leverageManagerV2Abi,
      functionName: 'getLeverageTokenConfig',
      args: [tokenAddress],
      chainId: chainId as SupportedChainId,
    })

    if (!managerResult) {
      throw new Error(`No leverage token config found for address: ${tokenAddress}`)
    }

    // Step 2: Get lending adapter address from the config
    const lendingAdapterAddress = (managerResult as { lendingAdapter: Address }).lendingAdapter

    if (!lendingAdapterAddress) {
      throw new Error('No lending adapter found in leverage token config')
    }

    // Step 3: Fetch market ID from lending adapter
    const marketId = await readContract(config, {
      address: lendingAdapterAddress,
      abi: lendingAdapterAbi,
      functionName: 'morphoMarketId',
      chainId: chainId as SupportedChainId,
    })

    if (!marketId) {
      throw new Error('No market ID found from lending adapter')
    }

    return marketId
  } catch (error) {
    logger.error('Error fetching Morpho market ID', { error, tokenAddress })
    throw new Error(
      `Failed to fetch Morpho market ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Morpho borrow APY provider implementation
 * Handles fetching borrow APY data from Morpho protocol
 */
export class MorphoBorrowApyProvider implements BorrowApyFetcher {
  protocolId = 'morpho'
  protocolName = 'Morpho'

  async fetchBorrowApy(
    tokenAddress: Address,
    chainId?: number,
    config?: Config,
  ): Promise<BaseBorrowApyData> {
    try {
      if (!chainId || !config) {
        throw new Error('Chain ID and config are required for fetching Morpho market ID')
      }

      // Fetch market ID using the lending adapter
      const marketId = await fetchMorphoMarketId(tokenAddress, chainId, config)

      // Fetch market data from Morpho using GraphQL with uniqueKey (marketId from contract)
      const response = await fetchMorphoMarketBorrowRate(marketId, chainId)

      if (!response.marketByUniqueKey) {
        throw new Error(`No market data found for unique key: ${marketId}`)
      }

      const marketData = response.marketByUniqueKey

      // Use 24-hour average borrow APY for current rates
      // This provides a more current representation of borrowing costs
      const borrowAPY = marketData.state.dailyBorrowApy
      const utilization = marketData.state.utilization

      const result: BaseBorrowApyData = {
        borrowAPY,
        utilization,
        averagingPeriod: '24-hour average',
      }

      return result
    } catch (error) {
      logger.error('Error fetching Morpho borrow APY', { error, tokenAddress })
      throw error
    }
  }
}

export type MorphoBorrowApyData = BaseBorrowApyData
