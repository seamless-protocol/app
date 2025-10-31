import { useMemo } from 'react'
import type { Address } from 'viem'
import { useAccount, useChainId, useReadContracts } from 'wagmi'
import { lendingAdapterAbi, type SupportedChainId } from '@/lib/contracts'
import { useReadLeverageManagerV2GetLeverageTokenLendingAdapter } from '@/lib/contracts/generated'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import { useLeverageTokenState } from './useLeverageTokenState'

export interface UseLeverageTokenUserPositionParams {
  tokenAddress?: Address
  chainIdOverride?: number
  tokenDecimals?: number
  collateralAssetAddress?: Address | undefined
  collateralAssetDecimals?: number | undefined
  debtAssetAddress?: Address | undefined
  debtAssetDecimals?: number | undefined
  enabled?: boolean
}

export interface LeverageTokenUserPositionData {
  balance?: bigint
  equityInDebt?: bigint
  equityUsd?: number | undefined
}

export function useLeverageTokenUserPosition({
  tokenAddress,
  chainIdOverride,
  collateralAssetAddress,
  collateralAssetDecimals,
  debtAssetAddress,
  debtAssetDecimals,
  enabled = true,
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
  } = useLeverageTokenState(tokenAddress as Address, chainId, enabled)

  const { data: lendingAdapterAddress } = useReadLeverageManagerV2GetLeverageTokenLendingAdapter({
    args: tokenAddress ? [tokenAddress] : undefined,
    chainId: chainId as SupportedChainId,
  })

  // Fetch collateral from lending adapter
  const {
    data: collateralData,
    isLoading: isCollateralLoading,
    isError: isCollateralError,
    error: collateralError,
  } = useReadContracts({
    contracts: [
      {
        address: lendingAdapterAddress,
        abi: lendingAdapterAbi,
        functionName: 'getCollateral' as const,
        chainId: chainId as SupportedChainId,
      },
    ],
  })

  // 2) Read user balance (shares)
  const {
    balance,
    isLoading: isBalLoading,
    isError: isBalError,
    error: balError,
  } = useTokenBalance({
    tokenAddress: tokenAddress as Address,
    userAddress: user as Address,
    chainId: chainId as import('@/lib/contracts/addresses').SupportedChainId,
    enabled: Boolean(tokenAddress && user && isConnected && enabled),
  })

  // 3) USD price for collateral and debt assets
  const { data: usdPriceMap } = useUsdPrices({
    chainId,
    addresses:
      collateralAssetAddress && debtAssetAddress ? [collateralAssetAddress, debtAssetAddress] : [],
    enabled: Boolean(collateralAssetAddress && debtAssetAddress && enabled),
  })

  const collateralPriceUsd = collateralAssetAddress
    ? usdPriceMap[collateralAssetAddress.toLowerCase()]
    : 0
  const debtPriceUsd = debtAssetAddress ? usdPriceMap[debtAssetAddress.toLowerCase()] : 0

  const data: LeverageTokenUserPositionData | undefined = useMemo(() => {
    if (
      !stateData ||
      !balance ||
      !collateralData ||
      !collateralPriceUsd ||
      !debtPriceUsd ||
      !collateralPriceUsd ||
      !debtAssetDecimals ||
      !collateralAssetDecimals
    ) {
      return undefined
    }

    const { debt, totalSupply } = stateData
    if (!totalSupply || totalSupply === 0n) {
      return { balance, equityInDebt: 0n, equityUsd: debtPriceUsd ? 0 : undefined }
    }
    const totalCollateral = collateralData[0]?.result

    const collateralValueUsd =
      collateralPriceUsd && totalCollateral
        ? (collateralPriceUsd * Number(totalCollateral)) / 10 ** collateralAssetDecimals
        : 0
    const debtValueUsd = (debtPriceUsd * Number(debt)) / 10 ** debtAssetDecimals

    const equityValueUsd = collateralValueUsd - debtValueUsd
    const equityValueInDebt = BigInt(
      Math.floor((equityValueUsd / debtPriceUsd) * 10 ** debtAssetDecimals),
    )

    const equityInDebtPerToken = (balance * equityValueInDebt) / totalSupply

    const equityUsd =
      typeof debtPriceUsd === 'number' &&
      Number.isFinite(debtPriceUsd) &&
      typeof debtAssetDecimals === 'number'
        ? (Number(equityInDebtPerToken) / 10 ** debtAssetDecimals) * debtPriceUsd
        : undefined
    return { balance, equityInDebt: equityInDebtPerToken, equityUsd }
  }, [
    stateData,
    balance,
    collateralPriceUsd,
    debtPriceUsd,
    collateralAssetDecimals,
    debtAssetDecimals,
    collateralData,
  ])

  return {
    data,
    isLoading: isStateLoading || isBalLoading || isCollateralLoading,
    isError: isStateError || isBalError || isCollateralError,
    error: stateError || balError || collateralError,
  }
}
