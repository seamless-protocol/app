import { useMemo } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { useChainId, useReadContracts } from 'wagmi'
import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { mockAPY, mockSupply } from '@/features/leverage-tokens/data/mockData'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'
import { getLeverageManagerAddress } from '@/lib/contracts/addresses'
import { useUsdPricesMultiChain } from '@/lib/prices/useUsdPricesMulti'
import { STALE_TIME } from '../utils/constants'

// Remove custom conversion - use viem's formatUnits instead

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

  // Collect unique debt asset addresses grouped by chain for USD pricing
  const addressesByChain = useMemo(() => {
    const map = new Map<number, Set<string>>()
    for (const cfg of configs) {
      const key = cfg.chainId
      if (!map.has(key)) map.set(key, new Set<string>())
      map.get(key)?.add(cfg.debtAsset.address.toLowerCase())
    }
    const out: Record<number, Array<string>> = {}
    for (const [cid, set] of map.entries()) {
      out[cid] = Array.from(set)
    }
    return out
  }, [configs])

  const { data: usdPricesByChain = {} } = useUsdPricesMultiChain({
    byChain: addressesByChain,
    enabled: Object.keys(addressesByChain).length > 0,
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
      } else {
        console.log(`Token ${cfg.symbol} - State call failed:`, stateRes)
      }

      if (supplyRes && supplyRes.status === 'success') {
        totalSupply = supplyRes.result as bigint
      } else {
        console.log(`Token ${cfg.symbol} - Supply call failed:`, supplyRes)
      }

      // Convert BigInt to numbers for UI using debt asset decimals
      const tvl = Number(formatUnits(equity, cfg.debtAsset.decimals))
      const priceUsd = usdPricesByChain[cfg.chainId]?.[cfg.debtAsset.address.toLowerCase()]
      const tvlUsd =
        typeof priceUsd === 'number' && Number.isFinite(priceUsd) ? tvl * priceUsd : undefined
      const currentSupply = Number(formatUnits(totalSupply, cfg.decimals ?? 18))

      const result: LeverageToken = {
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

      // Only add tvlUsd if we have a valid price
      if (tvlUsd !== undefined) {
        result.tvlUsd = tvlUsd
      }

      return result
    })
  }, [configs, data, usdPricesByChain])

  return { data: tokens, isLoading, isError, error }
}
