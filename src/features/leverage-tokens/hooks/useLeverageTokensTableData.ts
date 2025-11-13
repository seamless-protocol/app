import { useMemo } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { useReadContracts } from 'wagmi'
import { createLogger } from '@/lib/logger'

const logger = createLogger('leverage-tokens-table-data')

import type { LeverageToken } from '@/features/leverage-tokens/components/leverage-token-table'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { lendingAdapterAbi, leverageManagerV2Abi, leverageTokenAbi } from '@/lib/contracts'
import { getLeverageManagerAddress, type SupportedChainId } from '@/lib/contracts/addresses'
import { useUsdPricesMultiChain } from '@/lib/prices/useUsdPricesMulti'
import { STALE_TIME } from '../utils/constants'

export function useLeverageTokensTableData() {
  const configs = getAllLeverageTokenConfigs()

  // Build per-token manager + token calls, using each token's chainId & manager address
  const managerPlan = useMemo(() => {
    type ManagerContractDescriptor =
      | {
          address: Address
          abi: typeof leverageManagerV2Abi
          functionName: 'getLeverageTokenConfig'
          args: [Address]
          chainId: SupportedChainId
        }
      | {
          address: Address
          abi: typeof leverageManagerV2Abi
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
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenConfig' as const,
        args: [cfg.address],
        chainId: cfg.chainId as SupportedChainId,
      })
      // getLeverageTokenState(token)
      contracts.push({
        address: managerAddress,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenState' as const,
        args: [cfg.address],
        chainId: cfg.chainId as SupportedChainId,
      })
      // totalSupply()
      contracts.push({
        address: cfg.address,
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
      retry: 1, // Reduce retries to prevent excessive failed calls
      retryDelay: 1000,
    },
  })

  // Build lending adapter calls based on config results
  const lendingAdapterPlan = useMemo(() => {
    if (!managerData) return { contracts: [], indexMap: [] }

    type LendingContractDescriptor = {
      address: Address
      abi: typeof lendingAdapterAbi
      functionName: 'getCollateral'
      chainId: SupportedChainId
    }

    const contracts: Array<LendingContractDescriptor> = []
    const indexMap: Array<number | undefined> = []

    let callIndex = 0
    configs.forEach((cfg, i) => {
      const idx = managerPlan.indexMap[i]
      const configRes = idx ? managerData[idx.configIdx] : undefined

      if (configRes && configRes.status === 'success') {
        const config = configRes.result as {
          lendingAdapter: Address
          rebalanceAdapter: Address
          mintTokenFee: bigint
          redeemTokenFee: bigint
        }
        const lendingAdapterAddress = config.lendingAdapter
        contracts.push({
          address: lendingAdapterAddress,
          abi: lendingAdapterAbi,
          functionName: 'getCollateral' as const,
          chainId: cfg.chainId as SupportedChainId,
        })
        indexMap[i] = callIndex
        callIndex++
      } else {
        indexMap[i] = undefined
      }
    })

    return { contracts, indexMap }
  }, [managerData, configs, managerPlan.indexMap])

  const {
    data: lendingData,
    isLoading: isLendingLoading,
    isError: isLendingError,
    error: lendingError,
  } = useReadContracts({
    contracts: lendingAdapterPlan.contracts,
    query: {
      enabled: lendingAdapterPlan.contracts.length > 0,
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
      retry: 1,
      retryDelay: 1000,
    },
  })

  // Collect unique asset addresses (both collateral and debt) grouped by chain for USD pricing
  const addressesByChain = useMemo(() => {
    const map = new Map<number, Set<string>>()
    for (const cfg of configs) {
      const key = cfg.chainId
      if (!map.has(key)) map.set(key, new Set<string>())
      map.get(key)?.add(cfg.debtAsset.address.toLowerCase())
      map.get(key)?.add(cfg.collateralAsset.address.toLowerCase())
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
    staleTimeMs: 15 * 60 * 1000,
    refetchIntervalMs: 15 * 60 * 1000,
  })

  const tokens: Array<LeverageToken> = useMemo(() => {
    // If there's a critical error, return empty array to prevent crashes
    if (isManagerError && managerError) {
      logger.error('Critical error in useLeverageTokensTableData', {
        error: managerError,
        feature: 'leverage-tokens-table',
      })
      return []
    }

    return configs.map((cfg, i) => {
      const idx = managerPlan.indexMap[i]
      const configRes = idx ? managerData?.[idx.configIdx] : undefined
      const supplyRes = idx ? managerData?.[idx.supplyIdx] : undefined
      const lendingIdx = lendingAdapterPlan.indexMap[i]
      const collateralRes = lendingIdx !== undefined ? lendingData?.[lendingIdx] : undefined

      let totalSupply = 0n
      let collateral = 0n

      // Handle config call failure gracefully
      if (configRes && configRes.status !== 'success') {
        logger.warn('Token not registered in manager', {
          tokenAddress: cfg.address,
          error: configRes.error,
        })
      }

      if (supplyRes && supplyRes.status === 'success') {
        totalSupply = supplyRes.result as bigint
      } else {
        // Missing or failed supply read; keep defaults
      }

      if (collateralRes && collateralRes.status === 'success') {
        collateral = collateralRes.result as bigint
      } else {
        // Missing or failed collateral read; keep defaults
      }

      // Convert BigInt to numbers for UI using appropriate asset decimals
      const tvl = Number(formatUnits(collateral, cfg.collateralAsset.decimals))
      const currentSupply = Number(formatUnits(totalSupply, cfg.decimals ?? 18))

      // Calculate USD values using collateral asset price
      const collateralPriceUsd =
        usdPricesByChain[cfg.chainId]?.[cfg.collateralAsset.address.toLowerCase()]
      const tvlUsd =
        typeof collateralPriceUsd === 'number' && Number.isFinite(collateralPriceUsd)
          ? tvl * collateralPriceUsd
          : undefined

      const result: LeverageToken = {
        ...cfg,
        currentSupply,
        supplyCap: cfg.supplyCap ?? 0,
        tvl,
        ...(tvlUsd !== undefined && { tvlUsd }),
      }

      return result
    })
  }, [
    configs,
    managerData,
    lendingData,
    usdPricesByChain,
    managerPlan.indexMap,
    lendingAdapterPlan.indexMap,
    isManagerError,
    managerError,
  ])

  return {
    data: tokens,
    isLoading: isManagerLoading || isLendingLoading,
    isError: isManagerError || isLendingError,
    error: managerError || lendingError,
  }
}
