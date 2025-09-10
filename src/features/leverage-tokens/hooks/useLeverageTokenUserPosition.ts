import { useMemo } from 'react'
import type { Address } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
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
    balance,
    isLoading: isBalLoading,
    isError: isBalError,
    error: balError,
  } = useTokenBalance({
    tokenAddress: tokenAddress as Address,
    userAddress: user as Address,
    chainId,
    enabled: Boolean(tokenAddress && user && isConnected),
  })

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
