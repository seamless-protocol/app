import React from 'react'
import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { lendingAdapterAbi } from '../../../lib/contracts/abis/lendingAdapter'
import { leverageManagerV2Abi } from '../../../lib/contracts/abis/leverageManagerV2'
import { rebalanceAdapterAbi } from '../../../lib/contracts/abis/rebalanceAdapter'
import { getLeverageManagerAddress, type SupportedChainId } from '../../../lib/contracts/addresses'
import { formatPercentage } from '../../../lib/utils/formatting'
import type { LeverageTokenMetrics } from '../components/LeverageTokenDetailedMetrics'
import { getLeverageTokenConfig } from '../leverageTokens.config'
import { collateralRatioToLeverage } from '../utils/apy-calculations/leverage-ratios'
import { STALE_TIME } from '../utils/constants'

// Typed read result helper
export type ReadResult<T> = { status: 'success'; result: T } | { status: 'failure'; error: unknown }
/**
 * Hook to fetch detailed metrics for a leverage token using two-contract architecture
 * First fetches config from LeverageManager, then fetches detailed metrics from RebalanceAdapter
 */
export function useLeverageTokenDetailedMetrics(
  tokenAddress?: Address,
  supplyCapData?: { currentSupply: number; supplyCap: number; collateralAssetSymbol: string },
  borrowRateData?: { borrowRate: number; baseYield: number },
  utilizationData?: { utilization: number },
) {
  // Get the token config to determine the correct chain ID
  const tokenConfig = tokenAddress ? getLeverageTokenConfig(tokenAddress) : undefined
  const chainId = tokenConfig?.chainId
  const managerAddress = chainId ? getLeverageManagerAddress(chainId) : undefined

  // Step 1: Get leverage token config and state from LeverageManager

  type ManagerConfig = {
    lendingAdapter: Address
    rebalanceAdapter: Address
    mintTokenFee: bigint
    redeemTokenFee: bigint
  }

  type ManagerState = {
    collateralInDebtAsset: bigint
    debt: bigint
    equity: bigint
    collateralRatio: bigint
  }

  const {
    data: managerData,
    isLoading: isManagerLoading,
    isError: isManagerError,
    error: managerError,
    refetch: refetchManager,
  } = useReadContracts({
    contracts: [
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenConfig',
        args: tokenAddress ? [tokenAddress] : undefined,
        chainId: chainId as SupportedChainId,
      },
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenState',
        args: tokenAddress ? [tokenAddress] : undefined,
        chainId: chainId as SupportedChainId,
      },
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getTreasuryActionFee',
        args: [0], // Mint
        chainId: chainId as SupportedChainId,
      },
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getTreasuryActionFee',
        args: [1], // Redeem
        chainId: chainId as SupportedChainId,
      },
      {
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getManagementFee',
        args: tokenAddress ? [tokenAddress] : undefined,
        chainId: chainId as SupportedChainId,
      },
    ],
    query: {
      enabled: !!tokenAddress && !!managerAddress && !!chainId,
      staleTime: STALE_TIME.detailedMetrics,
    },
  })

  // Extract adapter addresses from typed manager config result
  const managerConfigRes = managerData?.[0] as ReadResult<ManagerConfig> | undefined
  const managerStateRes = managerData?.[1] as ReadResult<ManagerState> | undefined
  const mintTreasuryFeeRes = managerData?.[2] as ReadResult<bigint> | undefined
  const redeemTreasuryFeeRes = managerData?.[3] as ReadResult<bigint> | undefined
  const managementFeeRes = managerData?.[4] as ReadResult<bigint> | undefined
  const rebalanceAdapterAddress =
    managerConfigRes?.status === 'success' ? managerConfigRes.result.rebalanceAdapter : undefined
  const lendingAdapterAddress =
    managerConfigRes?.status === 'success' ? managerConfigRes.result.lendingAdapter : undefined

  // Step 2: Get detailed metrics from RebalanceAdapter
  const {
    data: adapterData,
    isLoading: isAdapterLoading,
    isError: isAdapterError,
    error: adapterError,
    refetch: refetchAdapter,
  } = useReadContracts({
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
        functionName: 'getAuctionDuration',
        chainId: chainId as SupportedChainId,
      },
      {
        address: rebalanceAdapterAddress,
        abi: rebalanceAdapterAbi,
        functionName: 'getCollateralRatioThreshold',
        chainId: chainId as SupportedChainId,
      },
      {
        address: rebalanceAdapterAddress,
        abi: rebalanceAdapterAbi,
        functionName: 'getRebalanceReward',
        chainId: chainId as SupportedChainId,
      },
      {
        address: rebalanceAdapterAddress,
        abi: rebalanceAdapterAbi,
        functionName: 'getInitialPriceMultiplier',
        chainId: chainId as SupportedChainId,
      },
      {
        address: rebalanceAdapterAddress,
        abi: rebalanceAdapterAbi,
        functionName: 'getMinPriceMultiplier',
        chainId: chainId as SupportedChainId,
      },
    ],
    query: {
      enabled: !!rebalanceAdapterAddress && !!chainId,
      staleTime: STALE_TIME.detailedMetrics,
    },
  })

  // Step 3: Get liquidation penalty from LendingAdapter
  const {
    data: lendingData,
    isLoading: isLendingLoading,
    isError: isLendingError,
    error: lendingError,
    refetch: refetchLending,
  } = useReadContracts({
    contracts: [
      {
        address: lendingAdapterAddress,
        abi: lendingAdapterAbi,
        functionName: 'getLiquidationPenalty',
        chainId: chainId as SupportedChainId,
      },
    ],
    query: {
      enabled: !!lendingAdapterAddress && !!chainId,
      staleTime: STALE_TIME.detailedMetrics,
    },
  })

  const isLoading = isManagerLoading || isAdapterLoading || isLendingLoading
  const isError = isManagerError || isAdapterError || isLendingError
  const error = managerError || adapterError || lendingError

  type AdapterData = readonly [
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
  ]
  type LendData = readonly [ReadResult<bigint>]

  const transformedData: LeverageTokenMetrics | undefined =
    managerConfigRes &&
    managerStateRes &&
    mintTreasuryFeeRes &&
    redeemTreasuryFeeRes &&
    managementFeeRes &&
    adapterData &&
    lendingData
      ? transformDetailedMetricsData(
          [
            managerConfigRes,
            managerStateRes,
            mintTreasuryFeeRes,
            redeemTreasuryFeeRes,
            managementFeeRes,
          ],
          adapterData as AdapterData,
          lendingData as LendData,
          supplyCapData,
          borrowRateData,
          utilizationData,
          {
            currentLeverage: managerStateRes?.status !== 'success',
            minMaxLeverage:
              adapterData?.[0]?.status !== 'success' || adapterData?.[1]?.status !== 'success',
            supplyCap: !supplyCapData,
            borrowRate: !borrowRateData,
            utilization: !utilizationData,
            fees: managerConfigRes?.status !== 'success',
            treasuryFees:
              mintTreasuryFeeRes?.status !== 'success' ||
              redeemTreasuryFeeRes?.status !== 'success' ||
              managementFeeRes?.status !== 'success',
            auctionSettings:
              adapterData?.[2]?.status !== 'success' || adapterData?.[3]?.status !== 'success',
            rebalanceReward:
              lendingData?.[0]?.status !== 'success' || adapterData?.[4]?.status !== 'success',
            priceMultipliers:
              adapterData?.[5]?.status !== 'success' || adapterData?.[6]?.status !== 'success',
          },
        )
      : undefined

  return {
    data: transformedData,
    isLoading,
    isError,
    error,
    // Individual loading states for metrics
    loadingStates: {
      currentLeverage: managerStateRes?.status !== 'success',
      minMaxLeverage:
        adapterData?.[0]?.status !== 'success' || adapterData?.[1]?.status !== 'success',
      supplyCap: !supplyCapData,
      borrowRate: !borrowRateData,
      utilization: !utilizationData,
      fees: managerConfigRes?.status !== 'success',
      treasuryFees:
        mintTreasuryFeeRes?.status !== 'success' ||
        redeemTreasuryFeeRes?.status !== 'success' ||
        managementFeeRes?.status !== 'success',
      auctionSettings:
        adapterData?.[2]?.status !== 'success' || adapterData?.[3]?.status !== 'success',
      rebalanceReward:
        lendingData?.[0]?.status !== 'success' || adapterData?.[4]?.status !== 'success',
      priceMultipliers:
        adapterData?.[5]?.status !== 'success' || adapterData?.[6]?.status !== 'success',
    },
    refetch: async () => {
      await Promise.all([
        (async () => {
          try {
            await refetchManager?.()
          } catch {}
        })(),
        (async () => {
          try {
            await refetchAdapter?.()
          } catch {}
        })(),
        (async () => {
          try {
            await refetchLending?.()
          } catch {}
        })(),
      ])
    },
  }
}

/**
 * Transform raw contract data into UI-friendly format
 */
function transformDetailedMetricsData(
  managerData: readonly [
    ReadResult<{
      lendingAdapter: Address
      rebalanceAdapter: Address
      mintTokenFee: bigint
      redeemTokenFee: bigint
    }>,
    ReadResult<{
      collateralInDebtAsset: bigint
      debt: bigint
      equity: bigint
      collateralRatio: bigint
    }>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
  ],
  adapterData: readonly [
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
    ReadResult<bigint>,
  ],
  lendingData: readonly [ReadResult<bigint>],
  supplyCapData?: { currentSupply: number; supplyCap: number; collateralAssetSymbol: string },
  borrowRateData?: { borrowRate: number; baseYield: number },
  utilizationData?: { utilization: number },
  loadingStates?: {
    currentLeverage: boolean
    minMaxLeverage: boolean
    supplyCap: boolean
    borrowRate: boolean
    utilization: boolean
    fees: boolean
    treasuryFees: boolean
    auctionSettings: boolean
    rebalanceReward: boolean
    priceMultipliers: boolean
  },
): LeverageTokenMetrics {
  // Extract data from manager calls
  const configResult = managerData[0]
  const stateResult = managerData[1]
  const mintTreasuryFeeResult = managerData[2]
  const redeemTreasuryFeeResult = managerData[3]
  const managementFeeResult = managerData[4]

  // Extract data from adapter calls
  const minCollateralRatioResult = adapterData[0]
  const maxCollateralRatioResult = adapterData[1]
  const auctionDurationResult = adapterData[2]
  const collateralRatioThresholdResult = adapterData[3]
  const rebalanceRewardResult = adapterData[4]
  const initialPriceMultiplierResult = adapterData[5]
  const minPriceMultiplierResult = adapterData[6]

  // Extract data from lending calls
  const liquidationPenaltyResult = lendingData[0]

  // Helper function to format leverage values
  const formatLeverage = (value: bigint): string => {
    const leverage = Number(value) / 1e18
    return `${leverage.toFixed(2)}x`
  }

  // Helper function to format fee values (18 decimals)
  const formatFee = (value: bigint): string => {
    const fee = (Number(value) / 1e18) * 100
    return `${fee.toFixed(2)}%`
  }

  // Helper function to format fee values (4 decimals)
  const formatFee4Decimals = (value: bigint): string => {
    const fee = (Number(value) / 1e4) * 100
    return `${fee.toFixed(2)}%`
  }

  // Helper function to format duration
  const formatDuration = (value: bigint): string => {
    const hours = Number(value) / 3600
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  // Helper function to format multiplier values (18 decimals)
  const formatMultiplier = (value: bigint): string => {
    const multiplier = Number(value) / 1e18
    return `${multiplier.toFixed(3)}x`
  }

  // Extract values with error handling
  const currentLeverage =
    stateResult?.status === 'success'
      ? formatLeverage(collateralRatioToLeverage(stateResult.result.collateralRatio))
      : 'N/A'

  const minLeverage =
    maxCollateralRatioResult?.status === 'success'
      ? formatLeverage(collateralRatioToLeverage(maxCollateralRatioResult.result as bigint))
      : 'N/A'

  const maxLeverage =
    minCollateralRatioResult?.status === 'success'
      ? formatLeverage(collateralRatioToLeverage(minCollateralRatioResult.result as bigint))
      : 'N/A'

  const mintTokenFee =
    configResult?.status === 'success'
      ? formatFee4Decimals(configResult.result.mintTokenFee)
      : 'N/A'

  const redeemTokenFee =
    configResult?.status === 'success'
      ? formatFee4Decimals(configResult.result.redeemTokenFee)
      : 'N/A'

  const mintTreasuryFee =
    mintTreasuryFeeResult?.status === 'success'
      ? formatFee4Decimals(mintTreasuryFeeResult.result)
      : 'N/A'

  const redeemTreasuryFee =
    redeemTreasuryFeeResult?.status === 'success'
      ? formatFee4Decimals(redeemTreasuryFeeResult.result)
      : 'N/A'

  const managementTreasuryFee =
    managementFeeResult?.status === 'success'
      ? formatFee4Decimals(managementFeeResult.result)
      : 'N/A'

  const dutchAuctionDuration =
    auctionDurationResult?.status === 'success'
      ? formatDuration(auctionDurationResult.result as bigint)
      : 'N/A'

  const preLiquidationLeverage =
    collateralRatioThresholdResult?.status === 'success'
      ? formatLeverage(collateralRatioToLeverage(collateralRatioThresholdResult.result as bigint))
      : 'N/A'

  // Calculate rebalance reward: liquidationPenalty * rebalanceReward
  // liquidationPenalty is in 18 decimals, rebalanceReward is in 4 decimals
  // So we need to convert rebalanceReward to 18 decimals first, then divide by 1e18
  const rebalanceReward =
    liquidationPenaltyResult?.status === 'success' && rebalanceRewardResult?.status === 'success'
      ? formatFee(
          ((liquidationPenaltyResult.result as bigint) *
            (rebalanceRewardResult.result as bigint) *
            10n ** 14n) /
            10n ** 18n,
        )
      : 'N/A'

  // Extract price multipliers
  const initialPriceMultiplier =
    initialPriceMultiplierResult?.status === 'success'
      ? formatMultiplier(initialPriceMultiplierResult.result as bigint)
      : 'N/A'

  const minPriceMultiplier =
    minPriceMultiplierResult?.status === 'success'
      ? formatMultiplier(minPriceMultiplierResult.result as bigint)
      : 'N/A'

  // Calculate supply cap status and color (same logic as SupplyCap component)
  let supplyCapColor = 'text-foreground'

  if (supplyCapData && supplyCapData.supplyCap > 0) {
    const percentage = (supplyCapData.currentSupply / supplyCapData.supplyCap) * 100

    // Show available amount with color, rest in default color
    const availableColor =
      percentage >= 100 ? 'text-red-500' : percentage >= 90 ? 'text-yellow-500' : 'text-green-500'

    supplyCapColor = availableColor
  }

  // Calculate borrow rate status and color
  let borrowRateValue = 'N/A'
  let borrowRateColor = 'text-foreground'
  let borrowRateTooltip = ''

  if (borrowRateData && borrowRateData.borrowRate > 0) {
    borrowRateValue = formatPercentage(borrowRateData.borrowRate, {
      decimals: 2,
      showSign: false,
    })

    const { borrowRate, baseYield } = borrowRateData
    const threshold = baseYield * 0.95 // 5% below base yield

    if (borrowRate > baseYield) {
      borrowRateColor = 'text-red-500' // Red when exceeds base yield
      borrowRateTooltip = 'Warning: The borrow rate currently exceeds the base yield.'
    } else if (borrowRate >= threshold) {
      borrowRateColor = 'text-yellow-500' // Yellow when near base yield (within 5%)
      borrowRateTooltip = 'Warning: The borrow rate is currently near the base yield.'
    } else {
      borrowRateColor = 'text-green-500' // Green when below base yield
    }
  }

  // Calculate market utilization status and color
  let utilizationValue = 'N/A'
  let utilizationColor = 'text-foreground'
  let utilizationTooltip = ''

  if (utilizationData && utilizationData.utilization !== undefined) {
    utilizationValue = `${formatPercentage(utilizationData.utilization, { decimals: 2, showSign: false })}`

    if (utilizationData.utilization >= 90) {
      utilizationColor = 'text-red-500' // Red when utilization is high (>= 90%)
      utilizationTooltip = 'Underlying lending market utilization is currently HIGH'
    } else {
      utilizationColor = 'text-green-500' // Green when utilization is below 90%
    }
  }

  return {
    Leverage: [
      {
        label: 'Current Leverage',
        value: currentLeverage,
        highlight: true,
        color: 'text-foreground',
        isLoading: loadingStates?.currentLeverage || false,
      },
      {
        label: 'Min - Max Leverage',
        value: `${minLeverage} - ${maxLeverage}`,
        color: 'text-foreground',
        isLoading: loadingStates?.minMaxLeverage || false,
      },
    ],
    'Lending Market': [
      {
        label: 'Remaining Supply Cap',
        value: React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'span',
            { className: supplyCapColor },
            supplyCapData
              ? (supplyCapData.supplyCap - supplyCapData.currentSupply).toLocaleString()
              : 'N/A',
          ),
          React.createElement(
            'span',
            { className: 'text-foreground' },
            supplyCapData
              ? ` of ${supplyCapData.supplyCap.toLocaleString()} ${supplyCapData.collateralAssetSymbol}`
              : '',
          ),
        ),
        highlight: true,
        isLoading: loadingStates?.supplyCap || false,
      },
      {
        label: 'Current Borrow Rate',
        value: borrowRateValue,
        highlight: true,
        color: borrowRateColor,
        isLoading: loadingStates?.borrowRate || false,
        ...(borrowRateTooltip && { tooltip: borrowRateTooltip }),
      },
      {
        label: 'Current Borrow Market Utilization',
        value: utilizationValue,
        highlight: true,
        color: utilizationColor,
        isLoading: loadingStates?.utilization || false,
        ...(utilizationTooltip && { tooltip: utilizationTooltip }),
      },
    ],
    Fees: [
      {
        label: 'Mint Token Fee',
        value: mintTokenFee,
        highlight: true,
        color: 'text-foreground',
        isLoading: loadingStates?.fees || false,
        tooltip:
          'Token fees accrue to current Leverage Token holders. This means users holding the LT benefit from the token fees paid by users minting.',
      },
      {
        label: 'Redeem Token Fee',
        value: redeemTokenFee,
        color: 'text-foreground',
        isLoading: loadingStates?.fees || false,
        tooltip:
          'Token fees accrue to current Leverage Token holders. This means users holding the LT benefit from the token fees paid by users redeeming.',
      },
      {
        label: 'Mint Treasury Fee',
        value: mintTreasuryFee,
        color: 'text-foreground',
        isLoading: loadingStates?.treasuryFees || false,
        tooltip: 'Mint Treasury Fee is the fee that is charged to the minting user.',
      },
      {
        label: 'Redeem Treasury Fee',
        value: redeemTreasuryFee,
        color: 'text-foreground',
        isLoading: loadingStates?.treasuryFees || false,
        tooltip: 'Redeem Treasury Fee is the fee that is charged to the redeeming user.',
      },
      {
        label: 'Management Treasury Fee',
        value: managementTreasuryFee,
        color: 'text-foreground',
        isLoading: loadingStates?.treasuryFees || false,
        tooltip: 'Management Treasury Fee is the fee that is charged to the management user.',
      },
    ],
    'Dutch Auction Parameters': [
      {
        label: 'Dutch Auction Duration',
        value: dutchAuctionDuration,
        color: 'text-foreground',
        isLoading: loadingStates?.auctionSettings || false,
      },
      {
        label: 'Initial Price Multiplier',
        value: initialPriceMultiplier,
        color: 'text-foreground',
        isLoading: loadingStates?.priceMultipliers || false,
      },
      {
        label: 'Min Price Multiplier',
        value: minPriceMultiplier,
        color: 'text-foreground',
        isLoading: loadingStates?.priceMultipliers || false,
      },
    ],
    'Pre-liquidation': [
      {
        label: 'Pre-liquidation Leverage',
        value: preLiquidationLeverage,
        color: 'text-foreground',
        isLoading: loadingStates?.auctionSettings || false,
        tooltip: 'Leverage threshold that triggers pre-liquidation protection',
      },
      {
        label: 'Rebalance Reward',
        value: rebalanceReward,
        color: 'text-foreground',
        isLoading: loadingStates?.rebalanceReward || false,
        tooltip: 'Reward percentage for successful rebalancing.',
      },
    ],
  }
}
