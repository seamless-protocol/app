import { useMemo } from 'react'
import type { Address } from 'viem'
import { useChainId, useReadContracts } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'
import { getLeverageManagerAddress } from '@/lib/contracts/addresses'
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
  const managerAddress = getLeverageManagerAddress(chainId)

  const contracts = useMemo(() => {
    if (!managerAddress || !tokenAddress) return []
    return [
      {
        address: managerAddress as Address,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenState' as const,
        args: [tokenAddress],
        chainId: chainId as typeof mainnet.id | typeof base.id,
      },
      {
        address: tokenAddress as Address,
        abi: leverageTokenAbi,
        functionName: 'totalSupply' as const,
        chainId: chainId as typeof mainnet.id | typeof base.id,
      },
    ]
  }, [managerAddress, tokenAddress, chainId])

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
