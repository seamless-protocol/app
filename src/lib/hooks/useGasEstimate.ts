import { useMemo } from 'react'
import { formatUnits } from 'viem'
import { useFeeData, usePublicClient } from 'wagmi'
import { useUsdPrices } from '../prices/useUsdPrices'

const getNativeTokenAddress = (chainId: number): string => {
  switch (chainId) {
    case 1: // Ethereum - use WETH (represents ETH)
      return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    default:
      return '0x4200000000000000000000000000000000000006'
  }
}

interface UseGasEstimateParams {
  chainId: number
  enabled?: boolean
}

interface GasEstimate {
  gasPrice: bigint
  gasPriceGwei: string
  gasPriceUsd: string
  estimatedGasLimit: bigint
  estimatedCostUsd: string
  isLoading: boolean
  isError: boolean
  error?: Error | null
}

/**
 * Hook to estimate gas costs for transactions
 * Fetches current gas price and calculates USD cost
 */
export function useGasEstimate({ chainId, enabled = true }: UseGasEstimateParams): GasEstimate {
  // Get current gas price data
  const {
    data: feeData,
    isLoading: isFeeDataLoading,
    isError: isFeeDataError,
    error: feeDataError,
  } = useFeeData({
    chainId,
  })

  // Get native token price for USD conversion
  // Gas fees are paid in native tokens (ETH, MATIC, etc.)
  const nativeTokenAddress = getNativeTokenAddress(chainId)
  const { data: nativeTokenPriceMap, isLoading: isNativeTokenPriceLoading } = useUsdPrices({
    chainId,
    addresses: [nativeTokenAddress],
    enabled: enabled && Boolean(feeData?.gasPrice || feeData?.maxFeePerGas),
  })

  const publicClient = usePublicClient({ chainId })

  const gasEstimate = useMemo(() => {
    // Use maxFeePerGas for EIP-1559 networks (like Base) or fallback to gasPrice
    let gasPrice = feeData?.maxFeePerGas || feeData?.gasPrice

    // Only use fallback if gas price is extremely low (less than 0.001 gwei = 1,000,000 wei)
    if (gasPrice && gasPrice < 1000000n) {
      gasPrice = 1000000000n // 1 gwei fallback
    }

    if (!gasPrice || !publicClient) {
      return {
        gasPrice: 0n,
        gasPriceGwei: '0',
        gasPriceUsd: '$0.00',
        estimatedGasLimit: 0n,
        estimatedCostUsd: '$0.00',
        isLoading: isFeeDataLoading || isNativeTokenPriceLoading,
        isError: isFeeDataError,
        error: feeDataError,
      }
    }
    const gasPriceGwei = formatUnits(gasPrice, 9) // 9 decimals for gwei

    // Get native token price for USD conversion
    const nativeTokenPrice = nativeTokenPriceMap?.[nativeTokenAddress.toLowerCase()] || 0
    const gasPriceInNativeToken = Number(formatUnits(gasPrice, 18))
    const gasPriceUsd = `$${(gasPriceInNativeToken * nativeTokenPrice).toFixed(4)}`

    // Estimate gas limit for a typical mint transaction
    // This is a reasonable estimate for complex DeFi transactions
    const estimatedGasLimit = 500000n // 500k gas limit
    const estimatedCostInNativeToken = Number(formatUnits(gasPrice * estimatedGasLimit, 18))
    const estimatedCostUsd = `$${(estimatedCostInNativeToken * nativeTokenPrice).toFixed(2)}`

    return {
      gasPrice,
      gasPriceGwei,
      gasPriceUsd,
      estimatedGasLimit,
      estimatedCostUsd,
      isLoading: isFeeDataLoading || isNativeTokenPriceLoading,
      isError: isFeeDataError,
      error: feeDataError,
    }
  }, [
    feeData,
    nativeTokenPriceMap,
    isFeeDataLoading,
    isNativeTokenPriceLoading,
    isFeeDataError,
    feeDataError,
    publicClient,
    nativeTokenAddress,
  ])

  return gasEstimate
}

/**
 * Hook to estimate gas costs for specific transaction types
 * Provides more accurate estimates based on transaction complexity
 */
export function useTransactionGasEstimate({
  chainId,
  transactionType = 'mint',
  enabled = true,
}: UseGasEstimateParams & { transactionType?: 'mint' | 'redeem' | 'approve' }): GasEstimate {
  // Get current gas price data
  const {
    data: feeData,
    isLoading: isFeeDataLoading,
    isError: isFeeDataError,
    error: feeDataError,
  } = useFeeData({
    chainId,
  })

  // Get native token price for USD conversion
  // Gas fees are paid in native tokens (ETH, MATIC, etc.)
  const nativeTokenAddress = getNativeTokenAddress(chainId)
  const { data: nativeTokenPriceMap, isLoading: isNativeTokenPriceLoading } = useUsdPrices({
    chainId,
    addresses: [nativeTokenAddress],
    enabled: enabled && Boolean(feeData?.gasPrice || feeData?.maxFeePerGas),
  })

  const gasLimits = {
    mint: 600000n, // Higher for complex mint operations
    redeem: 400000n, // Medium for redeem operations
    approve: 100000n, // Lower for simple approvals
  }

  const estimatedGasLimit = gasLimits[transactionType] || 500000n

  return useMemo(() => {
    // Use maxFeePerGas for EIP-1559 networks (like Base) or fallback to gasPrice
    let gasPrice = feeData?.maxFeePerGas || feeData?.gasPrice

    // Only use fallback if gas price is extremely low (less than 0.001 gwei = 1,000,000 wei)
    if (gasPrice && gasPrice < 1000000n) {
      gasPrice = 1000000000n // 1 gwei fallback
    }

    if (!gasPrice) {
      return {
        gasPrice: 0n,
        gasPriceGwei: '0',
        gasPriceUsd: '$0.00',
        estimatedGasLimit,
        estimatedCostUsd: '$0.00',
        isLoading: isFeeDataLoading || isNativeTokenPriceLoading,
        isError: isFeeDataError,
        error: feeDataError,
      }
    }
    const gasPriceGwei = formatUnits(gasPrice, 9) // 9 decimals for gwei

    // Get native token price for USD conversion
    const nativeTokenPrice = nativeTokenPriceMap?.[nativeTokenAddress.toLowerCase()] || 0
    const gasPriceInNativeToken = Number(formatUnits(gasPrice, 18))
    const gasPriceUsd = `$${(gasPriceInNativeToken * nativeTokenPrice).toFixed(4)}`

    // Calculate estimated cost for this transaction type
    // gasPrice is in wei, so we need to convert the total cost to native token
    const totalGasCostWei = gasPrice * estimatedGasLimit
    const estimatedCostInNativeToken = Number(formatUnits(totalGasCostWei, 18))
    const estimatedCostUsd = `$${(estimatedCostInNativeToken * nativeTokenPrice).toFixed(2)}`

    return {
      gasPrice,
      gasPriceGwei,
      gasPriceUsd,
      estimatedGasLimit,
      estimatedCostUsd,
      isLoading: isFeeDataLoading || isNativeTokenPriceLoading,
      isError: isFeeDataError,
      error: feeDataError,
    }
  }, [
    feeData,
    nativeTokenPriceMap,
    isFeeDataLoading,
    isNativeTokenPriceLoading,
    isFeeDataError,
    feeDataError,
    estimatedGasLimit,
    nativeTokenAddress,
  ])
}
