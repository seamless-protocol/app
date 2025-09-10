import type { Address } from 'viem'
import { useChainId, useReadContracts } from 'wagmi'
import { lendingAdapterAbi, leverageManagerAbi } from '@/lib/contracts'
import { getLeverageManagerAddress, type SupportedChainId } from '@/lib/contracts/addresses'
import { STALE_TIME } from '../utils/constants'

export interface UseLeverageTokenCollateralResult {
  collateral?: bigint | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
}

/**
 * Fetch total collateral for a leverage token via its LendingAdapter
 * Resolves manager → lendingAdapter → getCollateral, all on the token's chain.
 */
export function useLeverageTokenCollateral(
  tokenAddress?: Address,
  chainIdOverride?: number,
): UseLeverageTokenCollateralResult {
  const walletChainId = useChainId()
  const chainId = chainIdOverride ?? walletChainId
  const managerAddress = getLeverageManagerAddress(chainId)

  // Step 1: Resolve lending adapter from manager config
  const {
    data: managerData,
    isLoading: isManagerLoading,
    isError: isManagerError,
    error: managerError,
  } = useReadContracts({
    contracts: [
      {
        address: managerAddress,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenConfig',
        args: tokenAddress ? [tokenAddress] : undefined,
        chainId: chainId as SupportedChainId,
      },
    ],
    query: {
      enabled: Boolean(tokenAddress && managerAddress),
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  const managerConfigRes = managerData?.[0]
  const lendingAdapterAddress =
    managerConfigRes?.status === 'success' ? managerConfigRes.result.lendingAdapter : undefined

  // Step 2: Read collateral from lending adapter
  const {
    data: lendingData,
    isLoading: isLendingLoading,
    isError: isLendingError,
    error: lendingError,
  } = useReadContracts({
    contracts: [
      {
        address: lendingAdapterAddress,
        abi: lendingAdapterAbi,
        functionName: 'getCollateral',
        chainId: chainId as SupportedChainId,
      },
    ],
    query: {
      enabled: Boolean(lendingAdapterAddress),
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  const collateral =
    lendingData && lendingData[0]?.status === 'success' ? lendingData[0].result : undefined

  return {
    collateral,
    isLoading: isManagerLoading || isLendingLoading,
    isError: isManagerError || isLendingError,
    error: managerError || lendingError,
  }
}
