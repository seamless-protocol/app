import { useMemo } from 'react'
import type { Address } from 'viem'
import { useAccount, useChainId, useReadContracts } from 'wagmi'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import { STALE_TIME } from '../utils/constants'
import { useLeverageTokenState } from './useLeverageTokenState'

export interface UseLeverageTokenUserPositionParams {
  tokenAddress?: Address
  chainIdOverride?: number
  tokenDecimals?: number
  debtAssetAddress?: Address | undefined
  debtAssetDecimals?: number | undefined
}

export interface LeverageTokenUserPositionData {
  balance?: bigint
  equityInDebt?: bigint
  equityUsd?: number | undefined
}

export function useLeverageTokenUserPosition({
  tokenAddress,
  chainIdOverride,
  debtAssetAddress,
  debtAssetDecimals,
}: UseLeverageTokenUserPositionParams) {
  const { address: user, isConnected } = useAccount()
  const walletChainId = useChainId()
  const chainId = chainIdOverride ?? walletChainId

  // 1) Read on-chain state for equity/totalSupply
  const {
    data: stateData,
    isLoading: isStateLoading,
    isError: isStateError,
    error: stateError,
  } = useLeverageTokenState(tokenAddress as Address, chainId)

  // 2) Read user balance (shares)
  const {
    data: balanceData,
    isLoading: isBalLoading,
    isError: isBalError,
    error: balError,
  } = useReadContracts({
    contracts:
      tokenAddress && user
        ? [
            {
              address: tokenAddress,
              abi: leverageTokenAbi,
              functionName: 'balanceOf' as const,
              args: [user],
              chainId: chainId as 1 | 8453,
            },
          ]
        : [],
    query: {
      enabled: Boolean(tokenAddress && user && isConnected),
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  const balance =
    balanceData?.[0]?.status === 'success' ? (balanceData[0].result as bigint) : undefined

  // 3) USD price for debt asset
  const { data: usdPriceMap } = useUsdPrices({
    chainId,
    addresses: debtAssetAddress ? [debtAssetAddress] : [],
    enabled: Boolean(debtAssetAddress),
  })
  const debtUsd = debtAssetAddress ? usdPriceMap[debtAssetAddress.toLowerCase()] : undefined

  const data: LeverageTokenUserPositionData | undefined = useMemo(() => {
    if (!stateData || !balance) return undefined
    const { equity, totalSupply } = stateData
    if (!totalSupply || totalSupply === 0n) {
      return { balance, equityInDebt: 0n, equityUsd: debtUsd ? 0 : undefined }
    }
    const equityInDebt = (balance * equity) / totalSupply
    const equityUsd =
      typeof debtUsd === 'number' &&
      Number.isFinite(debtUsd) &&
      typeof debtAssetDecimals === 'number'
        ? (Number(equityInDebt) / 10 ** debtAssetDecimals) * debtUsd
        : undefined
    return { balance, equityInDebt, equityUsd }
  }, [stateData, balance, debtUsd, debtAssetDecimals])

  return {
    data,
    isLoading: isStateLoading || isBalLoading,
    isError: isStateError || isBalError,
    error: stateError || balError,
  }
}
