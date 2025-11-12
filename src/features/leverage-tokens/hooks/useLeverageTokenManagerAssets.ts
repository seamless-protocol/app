import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { getLeverageManagerAddress } from '@/lib/contracts/addresses'
import { leverageManagerV2Abi } from '@/lib/contracts/generated'

interface UseLeverageTokenManagerAssetsParams {
  token: Address
  chainId: SupportedChainId
  enabled?: boolean
}

/**
 * Fetches the collateral and debt assets for a leverage token from the manager contract.
 * Uses wagmi's useReadContracts for efficient batch fetching with built-in caching.
 */
export function useLeverageTokenManagerAssets({
  token,
  chainId,
  enabled = true,
}: UseLeverageTokenManagerAssetsParams) {
  const managerAddress = getLeverageManagerAddress(chainId)

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenCollateralAsset',
        args: [token],
        chainId,
      },
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenDebtAsset',
        args: [token],
        chainId,
      },
    ],
    query: {
      enabled: enabled && !!managerAddress,
      staleTime: Number.POSITIVE_INFINITY,
    },
  })

  const [collateralResult, debtResult] = data ?? []

  return {
    collateralAsset: collateralResult?.result,
    debtAsset: debtResult?.result,
    isLoading,
    error,
    refetch,
  }
}
