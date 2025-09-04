import { useMemo } from 'react'
import type { Address } from 'viem'
import { useChainId, useReadContracts } from 'wagmi'
import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { mockAPY, mockSupply } from '@/features/leverage-tokens/data/mockData'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'
import { getLeverageManagerAddress } from '@/lib/contracts/addresses'
import { STALE_TIME } from '../utils/constants'

function toNumber(value: bigint, decimals = 18): number {
  // Convert bigint to JS number scaled by decimals. For UI only.
  return Number(value) / 10 ** decimals
}

export function useLeverageTokensTableData() {
  const chainId = useChainId()
  const managerAddress = getLeverageManagerAddress(chainId)
  const configs = getAllLeverageTokenConfigs()

  const contracts = useMemo(() => {
    if (!managerAddress) return []
    return configs.flatMap((cfg) => [
      {
        address: managerAddress,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenState' as const,
        args: [cfg.address as Address],
      },
      {
        address: cfg.address as Address,
        abi: leverageTokenAbi,
        functionName: 'totalSupply' as const,
      },
    ])
  }, [configs, managerAddress])

  const { data, isLoading, isError, error } = useReadContracts({
    contracts,
    query: {
      enabled: Boolean(managerAddress && configs.length > 0),
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  const tokens: Array<LeverageToken> = useMemo(() => {
    if (!data || data.length === 0) return []

    return configs.map((cfg, i) => {
      const stateRes = data[2 * i]
      const supplyRes = data[2 * i + 1]

      let equity = 0n
      let totalSupply = 0n

      if (stateRes && stateRes.status === 'success') {
        const state = stateRes.result as {
          collateralInDebtAsset: bigint
          debt: bigint
          equity: bigint
          collateralRatio: bigint
        }
        equity = state.equity
      }

      if (supplyRes && supplyRes.status === 'success') {
        totalSupply = supplyRes.result as bigint
      }

      const tvl = toNumber(equity, 18)
      const currentSupply = toNumber(totalSupply, cfg.decimals ?? 18)

      return {
        id: cfg.address,
        name: cfg.name,
        collateralAsset: {
          symbol: cfg.collateralAsset.symbol,
          name: cfg.collateralAsset.name,
          address: cfg.collateralAsset.address,
        },
        debtAsset: {
          symbol: cfg.debtAsset.symbol,
          name: cfg.debtAsset.name,
          address: cfg.debtAsset.address,
        },
        tvl,
        apy: mockAPY.total,
        leverage: cfg.leverageRatio,
        supplyCap: mockSupply.supplyCap,
        currentSupply,
        chainId: cfg.chainId,
        chainName: cfg.chainName,
        chainLogo: cfg.chainLogo,
        baseYield: mockAPY.baseYield,
        borrowRate: mockAPY.borrowRate,
        rewardMultiplier: mockAPY.rewardMultiplier,
      }
    })
  }, [configs, data])

  return { data: tokens, isLoading, isError, error }
}
