import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { leverageManagerV2Abi } from '@/lib/contracts/abis/leverageManagerV2'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import { getLeverageTokenConfig } from '../leverageTokens.config'
import { STALE_TIME } from '../utils/constants'

export interface LeverageTokenFees {
  mintTokenFee: string
  redeemTokenFee: string
  mintTreasuryFee: string
  redeemTreasuryFee: string
  managementTreasuryFee: string
}

export function useLeverageTokenFees(tokenAddress?: Address) {
  // Get the token config to determine the correct chain ID
  const tokenConfig = tokenAddress ? getLeverageTokenConfig(tokenAddress) : undefined
  const chainId = tokenConfig?.chainId

  // Get contract addresses
  const contractAddresses = chainId ? getContractAddresses(chainId) : undefined
  const managerAddress = contractAddresses?.leverageManagerV2

  const {
    data: feesData,
    isLoading,
    isError,
    error,
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

  // Extract and format fees
  const configResult = feesData?.[0]
  const mintTreasuryFeeResult = feesData?.[1]
  const redeemTreasuryFeeResult = feesData?.[2]
  const managementFeeResult = feesData?.[3]

  const fees: LeverageTokenFees | undefined = feesData
    ? {
        mintTokenFee:
          configResult?.status === 'success'
            ? `${Number(configResult.result.mintTokenFee) / 100}%`
            : 'N/A',
        redeemTokenFee:
          configResult?.status === 'success'
            ? `${Number(configResult.result.redeemTokenFee) / 100}%`
            : 'N/A',
        mintTreasuryFee:
          mintTreasuryFeeResult?.status === 'success'
            ? `${Number(mintTreasuryFeeResult.result) / 100}%`
            : 'N/A',
        redeemTreasuryFee:
          redeemTreasuryFeeResult?.status === 'success'
            ? `${Number(redeemTreasuryFeeResult.result) / 100}%`
            : 'N/A',
        managementTreasuryFee:
          managementFeeResult?.status === 'success'
            ? `${Number(managementFeeResult.result) / 100}%`
            : 'N/A',
      }
    : undefined

  return {
    data: fees,
    isLoading,
    isError,
    error,
  }
}
