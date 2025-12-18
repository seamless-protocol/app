import { useMemo } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { useReadContracts } from 'wagmi'
import { lendingAdapterAbi, leverageManagerV2Abi } from '@/lib/contracts'
import { getLeverageManagerAddress, type SupportedChainId } from '@/lib/contracts/addresses'
import { useReadLeverageManagerV2GetLeverageTokenLendingAdapter } from '@/lib/contracts/generated'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import { getLeverageTokenConfig } from '../leverageTokens.config'
import { STALE_TIME } from '../utils/constants'

export interface UseLeverageTokenUsdPriceParams {
  tokenAddress: Address
}

export function useLeverageTokenUsdPrice({ tokenAddress }: UseLeverageTokenUsdPriceParams) {
  const tokenConfig = getLeverageTokenConfig(tokenAddress)

  const chainId = tokenConfig?.chainId
  const managerAddress = chainId ? getLeverageManagerAddress(chainId) : undefined

  const collateralAssetFromConfig = tokenConfig?.collateralAsset
  const debtAssetFromConfig = tokenConfig?.debtAsset
  const leverageTokenDecimals = tokenConfig?.decimals
  const collateralAssetDecimals = collateralAssetFromConfig?.decimals
  const debtAssetDecimals = debtAssetFromConfig?.decimals

  const { data: lendingAdapterAddress } = useReadLeverageManagerV2GetLeverageTokenLendingAdapter({
    args: [tokenAddress],
    chainId: chainId as SupportedChainId,
  })

  const {
    data: contractData,
    isLoading: isContractsLoading,
    isError: isContractsError,
    error: contractsError,
  } = useReadContracts({
    contracts: [
      {
        address: managerAddress as Address,
        abi: leverageManagerV2Abi,
        functionName: 'getFeeAdjustedTotalSupply' as const,
        args: [tokenAddress],
        chainId: chainId as SupportedChainId,
      },
      {
        address: lendingAdapterAddress,
        abi: lendingAdapterAbi,
        functionName: 'getDebt' as const,
        chainId: chainId as SupportedChainId,
      },
      {
        address: lendingAdapterAddress,
        abi: lendingAdapterAbi,
        functionName: 'getCollateral' as const,
        chainId: chainId as SupportedChainId,
      },
      {
        address: managerAddress as Address,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenState' as const,
        args: [tokenAddress],
        chainId: chainId as SupportedChainId,
      },
    ],
    query: {
      enabled: Boolean(
        chainId &&
          collateralAssetFromConfig?.address &&
          debtAssetFromConfig?.address &&
          lendingAdapterAddress,
      ),
      staleTime: STALE_TIME.price,
      refetchInterval: STALE_TIME.price,
    },
  })

  const {
    data: usdPriceMap,
    isLoading: isPricesLoading,
    isError: isPricesError,
    error: pricesError,
  } = useUsdPrices({
    chainId: chainId as number,
    addresses: [
      collateralAssetFromConfig?.address?.toLowerCase(),
      debtAssetFromConfig?.address?.toLowerCase(),
    ].filter(Boolean) as Array<string>,
    enabled: Boolean(chainId && collateralAssetFromConfig?.address && debtAssetFromConfig?.address),
    staleTimeMs: STALE_TIME.price,
    refetchIntervalMs: STALE_TIME.price,
  })

  const collateralPriceUsd = collateralAssetFromConfig?.address
    ? usdPriceMap[collateralAssetFromConfig?.address?.toLowerCase()]
    : undefined
  const debtPriceUsd = debtAssetFromConfig?.address
    ? usdPriceMap[debtAssetFromConfig?.address?.toLowerCase()]
    : undefined

  const priceUsd = useMemo(() => {
    if (
      !contractData?.[0]?.result ||
      !contractData?.[1]?.result ||
      !contractData?.[2]?.result ||
      !contractData?.[3]?.result ||
      !leverageTokenDecimals ||
      !collateralAssetDecimals ||
      !debtAssetDecimals
    ) {
      return undefined
    }

    if (
      collateralPriceUsd === undefined ||
      debtPriceUsd === undefined ||
      collateralAssetDecimals === undefined ||
      debtAssetDecimals === undefined
    ) {
      return undefined
    }

    const totalSupply = parseFloat(formatUnits(contractData?.[0]?.result, leverageTokenDecimals))

    const debtUsd =
      parseFloat(formatUnits(contractData?.[1]?.result, debtAssetDecimals)) * debtPriceUsd
    const collateralUsd =
      parseFloat(formatUnits(contractData?.[2]?.result, collateralAssetDecimals)) *
      collateralPriceUsd

    const leverageTokenState = contractData?.[3]?.result

    const equityUsd =
      parseFloat(formatUnits(leverageTokenState.equity, debtAssetDecimals)) *
      debtPriceUsd

    const price = equityUsd / totalSupply

    console.log('---------------- COMPUTED USD PRICE DEBUG ----------------', {
      tokenAddress,
      debtAssetDecimals,
      collateralAssetDecimals,
      leverageTokenDecimals,
      debt: contractData?.[1]?.result,
      collateral: contractData?.[2]?.result,
      debtPriceUsd,
      collateralPriceUsd,
      debtUsd,
      collateralUsd,
      equityUsd,
      totalSupply,
      price,
    })
    return price
  }, [
    contractData?.[0]?.result,
    contractData?.[1]?.result,
    contractData?.[2]?.result,
    collateralPriceUsd,
    debtPriceUsd,
    collateralAssetDecimals,
    debtAssetDecimals,
    leverageTokenDecimals,
  ])

  return {
    data: priceUsd,
    isLoading: isContractsLoading || isPricesLoading,
    isError: isContractsError || isPricesError,
    error: contractsError || pricesError,
  }
}
