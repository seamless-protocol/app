import { useMemo } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { useReadContracts } from 'wagmi'
import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { mockAPY, mockSupply } from '@/features/leverage-tokens/data/mockData'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'
import { getLeverageManagerAddress, type SupportedChainId } from '@/lib/contracts/addresses'
import { useUsdPricesMultiChain } from '@/lib/prices/useUsdPricesMulti'
import { STALE_TIME } from '../utils/constants'
// Supply caps are defined in the leverage token config

export function useLeverageTokensTableData() {
  const configs = getAllLeverageTokenConfigs()

  // Build per-token manager + token calls, using each token's chainId & manager address
  const managerPlan = useMemo(() => {
    type ManagerContractDescriptor =
      | {
          address: Address
          abi: typeof leverageManagerAbi
          functionName: 'getLeverageTokenConfig'
          args: [Address]
          chainId: SupportedChainId
        }
      | {
          address: Address
          abi: typeof leverageManagerAbi
          functionName: 'getLeverageTokenState'
          args: [Address]
          chainId: SupportedChainId
        }
      | {
          address: Address
          abi: typeof leverageTokenAbi
          functionName: 'totalSupply'
          chainId: SupportedChainId
        }
    type Idx = { configIdx: number; stateIdx: number; supplyIdx: number }
    const indexMap: Array<Idx | undefined> = []
    const contracts: Array<ManagerContractDescriptor> = []

    let callIndex = 0
    configs.forEach((cfg, i) => {
      const managerAddress = getLeverageManagerAddress(cfg.chainId)
      if (!managerAddress) {
        indexMap[i] = undefined
        return
      }

      // getLeverageTokenConfig(token)
      contracts.push({
        address: managerAddress,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenConfig' as const,
        args: [cfg.address as Address],
        chainId: cfg.chainId as SupportedChainId,
      })
      // getLeverageTokenState(token)
      contracts.push({
        address: managerAddress,
        abi: leverageManagerAbi,
        functionName: 'getLeverageTokenState' as const,
        args: [cfg.address as Address],
        chainId: cfg.chainId as SupportedChainId,
      })
      // totalSupply()
      contracts.push({
        address: cfg.address as Address,
        abi: leverageTokenAbi,
        functionName: 'totalSupply' as const,
        chainId: cfg.chainId as SupportedChainId,
      })

      indexMap[i] = { configIdx: callIndex, stateIdx: callIndex + 1, supplyIdx: callIndex + 2 }
      callIndex += 3
    })

    return { contracts, indexMap }
  }, [configs])

  const {
    data: managerData,
    isLoading: isManagerLoading,
    isError: isManagerError,
    error: managerError,
  } = useReadContracts({
    contracts: managerPlan.contracts,
    query: {
      enabled: managerPlan.contracts.length > 0,
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  // No lending adapter reads for table now (we don't show total collateral in table)

  // Collect unique asset addresses (both collateral and debt) grouped by chain for USD pricing
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
    return configs.map((cfg, i) => {
      const idx = managerPlan.indexMap[i]
      const stateRes = idx ? managerData?.[idx.stateIdx] : undefined
      const supplyRes = idx ? managerData?.[idx.supplyIdx] : undefined

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
        // Missing or failed state read; keep defaults
      }

      if (supplyRes && supplyRes.status === 'success') {
        totalSupply = supplyRes.result as bigint
      } else {
        // Missing or failed supply read; keep defaults
      }

      // Convert BigInt to numbers for UI using appropriate asset decimals
      const tvl = Number(formatUnits(equity, cfg.debtAsset.decimals))
      const collateralAmountNum = 0
      const debtAmountNum = 0
      const currentSupply = Number(formatUnits(totalSupply, cfg.decimals ?? 18))

      // Calculate USD values
      const debtPriceUsd = usdPricesByChain[cfg.chainId]?.[cfg.debtAsset.address.toLowerCase()]
      const tvlUsd =
        typeof debtPriceUsd === 'number' && Number.isFinite(debtPriceUsd)
          ? tvl * debtPriceUsd
          : undefined

      // Resolve supply cap from config (token units)
      const supplyCap = cfg.supplyCap ?? mockSupply.supplyCap

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
        collateralAmount: collateralAmountNum,
        debtAmount: debtAmountNum,
        apy: mockAPY.total,
        leverage: cfg.leverageRatio,
        supplyCap,
        currentSupply,
        chainId: cfg.chainId,
        chainName: cfg.chainName,
        chainLogo: cfg.chainLogo,
        baseYield: mockAPY.baseYield,
        borrowRate: mockAPY.borrowRate,
        rewardMultiplier: mockAPY.rewardMultiplier,
      }

      // Mark partial data when manager is not available on this chain
      if (!idx) {
        result.dataWarning = 'Manager address unavailable on this chain; showing partial data.'
      }

      // Only add USD values if we have valid prices
      if (tvlUsd !== undefined) {
        result.tvlUsd = tvlUsd
      }

      return result
    })
  }, [configs, managerData, usdPricesByChain, managerPlan.indexMap])

  return {
    data: tokens,
    isLoading: isManagerLoading,
    isError: isManagerError,
    error: managerError,
  }
}
