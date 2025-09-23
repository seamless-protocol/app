import { useMemo } from 'react'
import type { Address } from 'viem'
import { useChainId, useReadContracts } from 'wagmi'
import { leverageManagerAbi, leverageManagerV2Abi, leverageTokenAbi } from '@/lib/contracts'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import { STALE_TIME } from '../utils/constants'

export interface LeverageTokenStateData {
  totalSupply: bigint
  collateralInDebtAsset: bigint
  debt: bigint
  equity: bigint
  collateralRatio: bigint
}
export function useLeverageTokenState(tokenAddress: Address, chainIdOverride?: number) {
  const walletChainId = useChainId()
  const chainId = chainIdOverride ?? walletChainId
  const contractAddresses = getContractAddresses(chainId)
  const managerAddress = contractAddresses?.leverageManagerV2 ?? contractAddresses?.leverageManager
  const isV2Manager = Boolean(
    contractAddresses?.leverageManagerV2 && managerAddress === contractAddresses?.leverageManagerV2,
  )
  const managerAbi = isV2Manager ? leverageManagerV2Abi : leverageManagerAbi

  const contracts = useMemo(() => {
    if (!managerAddress || !tokenAddress) return []
    return [
      {
        address: managerAddress as Address,
        abi: managerAbi,
        functionName: 'getLeverageTokenState' as const,
        args: [tokenAddress],
        chainId: chainId as SupportedChainId,
      },
      {
        address: tokenAddress as Address,
        abi: leverageTokenAbi,
        functionName: 'totalSupply' as const,
        chainId: chainId as SupportedChainId,
      },
    ]
  }, [managerAddress, managerAbi, tokenAddress, chainId])

  const { data, isLoading, isError, error } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  if (!data || data.length < 2 || isLoading) {
    return { data: undefined, isLoading, isError, error }
  }

  const [stateRes, supplyRes] = data

  if (!stateRes || !supplyRes || stateRes.status !== 'success' || supplyRes.status !== 'success') {
    return { data: undefined, isLoading, isError: true, error }
  }

  const state = stateRes.result as {
    collateralInDebtAsset: bigint
    debt: bigint
    equity: bigint
    collateralRatio: bigint
  }

  const totalSupply = supplyRes.result as bigint

  const result: LeverageTokenStateData = {
    totalSupply,
    collateralInDebtAsset: state.collateralInDebtAsset,
    debt: state.debt,
    equity: state.equity,
    collateralRatio: state.collateralRatio,
  }

  return { data: result, isLoading, isError, error }
}
