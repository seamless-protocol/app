import type { Address } from 'viem'
import { getLeverageManagerAddress } from '../../../lib/contracts/addresses'
import { useReadLeverageManagerV2GetLeverageTokenConfig } from '../../../lib/contracts/generated'
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
 * This includes mint and redemption fees but NOT management fee.
 * Management fee should be fetched separately where needed for display.
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
    data: configData,
    isLoading: isConfigLoading,
    isError: isConfigError,
    error: configError,
  } = useReadLeverageManagerV2GetLeverageTokenConfig({
    address: managerAddress,
    args: tokenAddress ? [tokenAddress] : undefined,
    chainId,
    query: {
      enabled: Boolean(tokenAddress && managerAddress),
      staleTime: STALE_TIME.metadata,
    },
  })

  return {
    config: configData,
    isLoading: isConfigLoading,
    isError: isConfigError,
    error: configError,
  }
}
