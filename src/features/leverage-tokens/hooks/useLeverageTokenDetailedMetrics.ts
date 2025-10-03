import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { lendingAdapterAbi } from '../../../lib/contracts/abis/lendingAdapter'
import { leverageManagerV2Abi } from '../../../lib/contracts/abis/leverageManagerV2'
import { rebalanceAdapterAbi } from '../../../lib/contracts/abis/rebalanceAdapter'
import { getLeverageManagerAddress, type SupportedChainId } from '../../../lib/contracts/addresses'
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
export function useLeverageTokenDetailedMetrics(tokenAddress?: Address) {
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
    ],
    query: {
      enabled: !!tokenAddress && !!managerAddress && !!chainId,
      staleTime: STALE_TIME.detailedMetrics,
    },
  })

  // Extract adapter addresses from typed manager config result
  const managerConfigRes = managerData?.[0] as ReadResult<ManagerConfig> | undefined
  const managerStateRes = managerData?.[1] as ReadResult<ManagerState> | undefined
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
    managerConfigRes && managerStateRes && adapterData && lendingData
      ? transformDetailedMetricsData(
          [managerConfigRes, managerStateRes],
          adapterData as AdapterData,
          lendingData as LendData,
        )
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

  return {
    Leverage: [
      {
        label: 'Current Leverage',
        value: currentLeverage,
        highlight: true,
        color: 'text-white',
      },
      {
        label: 'Min - Max Leverage',
        value: `${minLeverage} - ${maxLeverage}`,
        color: 'text-white',
      },
    ],
    Fees: [
      {
        label: 'Mint Token Fee',
        value: mintTokenFee,
        highlight: true,
        color: 'text-white',
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
    'Pre-liquidation': [
      {
        label: 'Pre-liquidation Leverage',
        value: preLiquidationLeverage,
        color: 'text-white',
        tooltip: 'Leverage threshold that triggers pre-liquidation protection',
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
