import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { leverageManagerV2Abi } from '../../../lib/contracts/abis/leverageManagerV2'
import { getLeverageManagerAddress, type SupportedChainId } from '../../../lib/contracts/addresses'
import { getLeverageTokenConfig } from '../leverageTokens.config'
import { STALE_TIME } from '../utils/constants'

export interface LeverageTokenConfigData {
  lendingAdapter: Address
  rebalanceAdapter: Address
  mintTokenFee: bigint
  redeemTokenFee: bigint
}

export interface UseLeverageTokenConfigResult {
  config: LeverageTokenConfigData | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
}

/**
 * Hook to fetch the leverage token configuration from the contract.
 * This includes both mint and redemption fees.
 */
export function useLeverageTokenConfig(
  tokenAddress?: Address,
  chainIdOverride?: number,
): UseLeverageTokenConfigResult {
  // Get the token config to determine the correct chain ID
  const tokenConfig = tokenAddress ? getLeverageTokenConfig(tokenAddress) : undefined
  const chainId = chainIdOverride ?? tokenConfig?.chainId
  const managerAddress = chainId ? getLeverageManagerAddress(chainId) : undefined

  const {
    data: managerData,
    isLoading: isManagerLoading,
    isError: isManagerError,
    error: managerError,
  } = useReadContracts({
    contracts: [
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
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
  const config = managerConfigRes?.status === 'success' ? managerConfigRes.result : undefined

  return {
    config,
    isLoading: isManagerLoading,
    isError: isManagerError,
    error: managerError,
  }
}
