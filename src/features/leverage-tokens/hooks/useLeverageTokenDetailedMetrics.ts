import { useReadContracts, useChainId } from 'wagmi'
import type { Address } from 'viem'
import { leverageManagerAbi } from '../../../lib/contracts/abis/leverageManager'
import { rebalanceAdapterAbi } from '../../../lib/contracts/abis/rebalanceAdapter'
import { lendingAdapterAbi } from '../../../lib/contracts/abis/lendingAdapter'
import { getLeverageManagerAddress } from '../../../lib/contracts/addresses'
import { STALE_TIME } from '../utils/constants'
import type { LeverageTokenMetrics } from '../components/LeverageTokenDetailedMetrics'


// Helper to convert collateral ratio to leverage
const collateralRatioToLeverage = (collateralRatio: bigint): bigint => {
  const BASE_RATIO = 10n ** 18n // 1e18
  return (collateralRatio * BASE_RATIO) / (collateralRatio - BASE_RATIO)
}

/**
 * Hook to fetch detailed metrics for a leverage token using two-contract architecture
 * First fetches config from LeverageManager, then fetches detailed metrics from RebalanceAdapter
 */
export function useLeverageTokenDetailedMetrics(tokenAddress?: Address) {
  const chainId = useChainId()
  const managerAddress = getLeverageManagerAddress(chainId)

  // Step 1: Get leverage token config and state from LeverageManager
  const { data: managerData, isLoading: isManagerLoading, isError: isManagerError, error: managerError } = useReadContracts({
    contracts: [
      { 
        address: managerAddress, 
        abi: leverageManagerAbi, 
        functionName: 'getLeverageTokenConfig', 
        args: tokenAddress ? [tokenAddress] : undefined 
      },
      { 
        address: managerAddress, 
        abi: leverageManagerAbi, 
        functionName: 'getLeverageTokenState', 
        args: tokenAddress ? [tokenAddress] : undefined 
      },
    ],
    query: {
      enabled: !!tokenAddress && !!managerAddress,
      staleTime: STALE_TIME.detailedMetrics,
    },
  })

  // Extract rebalance adapter address from config
  const rebalanceAdapterAddress = managerData?.[0]?.status === 'success' 
    ? (managerData[0].result as any).rebalanceAdapter 
    : undefined

  // Extract lending adapter address from config
  const lendingAdapterAddress = managerData?.[0]?.status === 'success' 
    ? (managerData[0].result as any).lendingAdapter 
    : undefined

  // Step 2: Get detailed metrics from RebalanceAdapter
  const { data: adapterData, isLoading: isAdapterLoading, isError: isAdapterError, error: adapterError } = useReadContracts({
    contracts: [
      { 
        address: rebalanceAdapterAddress, 
        abi: rebalanceAdapterAbi, 
        functionName: 'getLeverageTokenMinCollateralRatio' 
      },
      { 
        address: rebalanceAdapterAddress, 
        abi: rebalanceAdapterAbi, 
        functionName: 'getLeverageTokenMaxCollateralRatio' 
      },
      { 
        address: rebalanceAdapterAddress, 
        abi: rebalanceAdapterAbi, 
        functionName: 'getAuctionDuration' 
      },
      { 
        address: rebalanceAdapterAddress, 
        abi: rebalanceAdapterAbi, 
        functionName: 'getCollateralRatioThreshold' 
      },
      { 
        address: rebalanceAdapterAddress, 
        abi: rebalanceAdapterAbi, 
        functionName: 'getRebalanceReward' 
      },
      { 
        address: rebalanceAdapterAddress, 
        abi: rebalanceAdapterAbi, 
        functionName: 'getInitialPriceMultiplier' 
      },
      { 
        address: rebalanceAdapterAddress, 
        abi: rebalanceAdapterAbi, 
        functionName: 'getMinPriceMultiplier' 
      },
    ],
    query: {
      enabled: !!rebalanceAdapterAddress,
      staleTime: STALE_TIME.detailedMetrics,
    },
  })

  // Step 3: Get liquidation penalty from LendingAdapter
  const { data: lendingData, isLoading: isLendingLoading, isError: isLendingError, error: lendingError } = useReadContracts({
    contracts: [
      { 
        address: lendingAdapterAddress, 
        abi: lendingAdapterAbi, 
        functionName: 'getLiquidationPenalty' 
      },
    ],
    query: {
      enabled: !!lendingAdapterAddress,
      staleTime: STALE_TIME.detailedMetrics,
    },
  })

  const isLoading = isManagerLoading || isAdapterLoading || isLendingLoading
  const isError = isManagerError || isAdapterError || isLendingError
  const error = managerError || adapterError || lendingError

  const transformedData: LeverageTokenMetrics | undefined = 
    managerData && adapterData && lendingData
      ? transformDetailedMetricsData(managerData, adapterData, lendingData)
      : undefined

  return {
    data: transformedData,
    isLoading,
    isError,
    error,
    refetch: () => {
      // Note: useReadContracts doesn't expose refetch, but we can trigger re-render by changing dependencies
      window.location.reload()
    },
  }
}

/**
 * Transform raw contract data into UI-friendly format
 */
function transformDetailedMetricsData(
  managerData: readonly any[],
  adapterData: readonly any[],
  lendingData: readonly any[]
): LeverageTokenMetrics {
  // Extract data from manager calls
  const configResult = managerData[0]
  const stateResult = managerData[1]
  
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

  // Helper function to format fee values
  const formatFee = (value: bigint): string => {
    const fee = (Number(value) / 1e18) * 100
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
  const currentLeverage = stateResult?.status === 'success' 
    ? formatLeverage(collateralRatioToLeverage((stateResult.result as any).collateralRatio))
    : 'N/A'

  const minLeverage = maxCollateralRatioResult?.status === 'success' 
    ? formatLeverage(collateralRatioToLeverage(maxCollateralRatioResult.result as bigint))
    : 'N/A'

  const maxLeverage = minCollateralRatioResult?.status === 'success' 
    ? formatLeverage(collateralRatioToLeverage(minCollateralRatioResult.result as bigint))
    : 'N/A'

  const mintTokenFee = configResult?.status === 'success' 
    ? formatFee((configResult.result as any).mintTokenFee)
    : 'N/A'

  const redeemTokenFee = configResult?.status === 'success' 
    ? formatFee((configResult.result as any).redeemTokenFee)
    : 'N/A'

  const dutchAuctionDuration = auctionDurationResult?.status === 'success' 
    ? formatDuration(auctionDurationResult.result as bigint)
    : 'N/A'

  const preLiquidationLeverage = collateralRatioThresholdResult?.status === 'success' 
    ? formatLeverage(collateralRatioToLeverage(collateralRatioThresholdResult.result as bigint))
    : 'N/A'

  // Calculate rebalance reward: liquidationPenalty * preLiquidationRebalanceReward
  const rebalanceReward = 
    liquidationPenaltyResult?.status === 'success' && rebalanceRewardResult?.status === 'success'
      ? formatFee((liquidationPenaltyResult.result as bigint) * (rebalanceRewardResult.result as bigint) / (10n ** 18n))
      : 'N/A'

  // Extract price multipliers
  const initialPriceMultiplier = initialPriceMultiplierResult?.status === 'success' 
    ? formatMultiplier(initialPriceMultiplierResult.result as bigint)
    : 'N/A'

  const minPriceMultiplier = minPriceMultiplierResult?.status === 'success' 
    ? formatMultiplier(minPriceMultiplierResult.result as bigint)
    : 'N/A'

  return {
    'Leverage Settings': [
      {
        label: 'Current Leverage',
        value: currentLeverage,
        highlight: true,
        color: 'text-white',
        tooltip: 'The current leverage ratio for this token.',
      },
      {
        label: 'Min - Max Leverage',
        value: `${minLeverage} - ${maxLeverage}`,
        color: 'text-white',
        tooltip: 'The minimum and maximum leverage range allowed.',
      },
    ],
    Fees: [
      {
        label: 'Mint Token Fee',
        value: mintTokenFee,
        highlight: true,
        color: 'text-green-400',
        tooltip: 'Fee charged when minting new leverage tokens.',
      },
      {
        label: 'Redeem Token Fee',
        value: redeemTokenFee,
        color: 'text-white',
        tooltip: 'Fee charged when redeeming leverage tokens.',
      },
    ],
    'Auction Parameters': [
      {
        label: 'Dutch Auction Duration',
        value: dutchAuctionDuration,
        color: 'text-white',
        tooltip: 'Duration of the Dutch auction for token redemptions.',
      },
      {
        label: 'Initial Price Multiplier',
        value: initialPriceMultiplier,
        color: 'text-white',
        tooltip: 'Initial price multiplier for the auction.',
      },
      {
        label: 'Min Price Multiplier',
        value: minPriceMultiplier,
        color: 'text-white',
        tooltip: 'Minimum price multiplier for the auction.',
      },
    ],
    'Risk Management': [
      {
        label: 'Pre-liquidation Leverage',
        value: preLiquidationLeverage,
        color: 'text-white',
        tooltip: 'Leverage threshold before liquidation is triggered.',
      },
      {
        label: 'Rebalance Reward',
        value: rebalanceReward,
        color: 'text-white',
        tooltip: 'Reward percentage for successful rebalancing.',
      },
    ],
  }
}