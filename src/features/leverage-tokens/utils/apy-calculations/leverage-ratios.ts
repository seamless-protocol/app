import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { readContracts } from 'wagmi/actions'
import { leverageManagerV2Abi } from '../../../../lib/contracts/abis/leverageManagerV2'
import { rebalanceAdapterAbi } from '../../../../lib/contracts/abis/rebalanceAdapter'
import {
  getLeverageManagerAddress,
  type SupportedChainId,
} from '../../../../lib/contracts/addresses'

export interface LeverageRatios {
  minLeverage: number
  maxLeverage: number
  targetLeverage: number
}

/**
 * Converts collateral ratio to leverage ratio
 * Formula: leverage = collateralRatio / (collateralRatio - 1)
 * Returns bigint for maximum precision
 */
export const collateralRatioToLeverage = (collateralRatio: bigint): bigint => {
  const BASE_RATIO = 10n ** 18n // 1e18
  return (collateralRatio * BASE_RATIO) / (collateralRatio - BASE_RATIO)
}

/**
 * Fetches leverage ratios for a leverage token
 * This is a standalone function that can be called from queryFn
 */
export async function fetchLeverageRatios(
  tokenAddress: Address,
  chainId: number,
  config: Config,
): Promise<LeverageRatios> {
  const managerAddress = getLeverageManagerAddress(chainId)

  if (!managerAddress) {
    throw new Error(`No leverage manager address found for chain ID: ${chainId}`)
  }

  // Step 1: Get leverage token config from LeverageManager
  const managerResults = await readContracts(config, {
    contracts: [
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenConfig',
        args: [tokenAddress],
        chainId: chainId as SupportedChainId,
      },
    ],
  })

  const [managerResult] = managerResults

  if (!managerResult?.result || managerResult.status !== 'success') {
    throw new Error('Failed to get leverage token config')
  }

  const rebalanceAdapterAddress = managerResult.result.rebalanceAdapter as Address

  // Step 2: Get collateral ratios from RebalanceAdapter
  const ratioResults = await readContracts(config, {
    contracts: [
      {
        address: rebalanceAdapterAddress,
        abi: rebalanceAdapterAbi,
        functionName: 'getLeverageTokenMinCollateralRatio',
        chainId: chainId as SupportedChainId,
      },
      {
        address: rebalanceAdapterAddress,
        abi: rebalanceAdapterAbi,
        functionName: 'getLeverageTokenMaxCollateralRatio',
        chainId: chainId as SupportedChainId,
      },
      {
        address: rebalanceAdapterAddress,
        abi: rebalanceAdapterAbi,
        functionName: 'getLeverageTokenTargetCollateralRatio',
        chainId: chainId as SupportedChainId,
      },
    ],
  })

  const [minResult, maxResult, targetResult] = ratioResults

  if (
    !minResult?.result ||
    !maxResult?.result ||
    !targetResult?.result ||
    minResult.status !== 'success' ||
    maxResult.status !== 'success' ||
    targetResult.status !== 'success'
  ) {
    throw new Error('Failed to fetch leverage ratios')
  }

  const minLeverage = Number(collateralRatioToLeverage(minResult.result as bigint)) / 1e18
  const maxLeverage = Number(collateralRatioToLeverage(maxResult.result as bigint)) / 1e18
  const targetLeverage = Number(collateralRatioToLeverage(targetResult.result as bigint)) / 1e18

  return {
    minLeverage,
    maxLeverage,
    targetLeverage,
  }
}
