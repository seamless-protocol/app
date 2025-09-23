import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { RouterVersion } from '@/domain/mint/planner/types'
import { detectRouterVersion } from '@/domain/mint/utils/detectVersion'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { getContractAddresses } from '@/lib/contracts/addresses'
import {
  readLeverageManagerPreviewRedeem,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'

export interface RedeemPreviewResult {
  collateral: bigint
  debt: bigint
  shares: bigint
  equity?: bigint
  tokenFee?: bigint
  treasuryFee?: bigint
}

export function useRedeemPreview(params: {
  config: Config
  token: Address
  sharesToRedeem: bigint | undefined
  debounceMs?: number
  chainId?: number
}) {
  const { config, token, sharesToRedeem, debounceMs = 350, chainId } = params

  console.log('🔍 useRedeemPreview invoked:', {
    token,
    sharesToRedeem: sharesToRedeem?.toString(),
    debounceMs,
    chainId,
    timestamp: Date.now(),
  })

  // Local debounce of the raw bigint input so the query only runs after idle
  const debounced = useDebouncedBigint(sharesToRedeem, debounceMs)
  const enabled = useMemo(() => typeof debounced === 'bigint' && debounced > 0n, [debounced])

  // Derive active chain id from wagmi config for multi-chain cache isolation
  const detectedChainId = chainId ?? getPublicClient(config)?.chain?.id
  const contracts = detectedChainId ? getContractAddresses(detectedChainId) : undefined

  const requestedVersion = detectRouterVersion()
  const managerV2Address = contracts?.leverageManagerV2
  const managerV1Address = contracts?.leverageManager
  const effectiveVersion = (() => {
    if (requestedVersion === RouterVersion.V2) return RouterVersion.V2
    if (!managerV1Address && managerV2Address) return RouterVersion.V2
    return RouterVersion.V1
  })()
  const useV2 = effectiveVersion === RouterVersion.V2 && Boolean(managerV2Address)
  const managerAddress = useV2 ? managerV2Address : (managerV1Address ?? managerV2Address)

  const amountForKey = enabled && typeof debounced === 'bigint' ? (debounced as bigint) : 0n
  const queryKey = ltKeys.simulation.redeemKey({
    chainId: detectedChainId,
    addr: token,
    amount: amountForKey,
  })

  const query = useQuery<RedeemPreviewResult, Error>({
    queryKey,
    // Only executes when enabled=true
    queryFn: async () => {
      if (useV2 && managerV2Address) {
        console.log('📞 Calling readLeverageManagerV2PreviewRedeem:', {
          function: 'readLeverageManagerV2PreviewRedeem',
          contractAddress: managerV2Address,
          token,
          amount: debounced?.toString(),
          chainId: detectedChainId,
        })

        const res = await readLeverageManagerV2PreviewRedeem(config, {
          address: managerV2Address,
          args: [token, debounced ?? 0n],
        })

        console.log('✅ V2 Redeem Preview result:', {
          collateral: res.collateral.toString(),
          debt: res.debt.toString(),
          shares: res.shares.toString(),
          tokenFee: res.tokenFee?.toString(),
          treasuryFee: res.treasuryFee?.toString(),
        })

        return {
          collateral: res.collateral,
          debt: res.debt,
          shares: res.shares,
          tokenFee: res.tokenFee,
          treasuryFee: res.treasuryFee,
        }
      }

      console.log('📞 Calling readLeverageManagerPreviewRedeem:', {
        function: 'readLeverageManagerPreviewRedeem',
        contractAddress: managerAddress,
        token,
        amount: debounced?.toString(),
        chainId: detectedChainId,
      })

      const res = await readLeverageManagerPreviewRedeem(config, {
        ...(managerAddress ? { address: managerAddress } : {}),
        args: [token, debounced ?? 0n],
      })

      console.log('✅ V1 Redeem Preview result:', {
        collateral: res.collateral.toString(),
        debt: res.debt.toString(),
        shares: res.shares.toString(),
        equity: res.equity?.toString(),
        tokenFee: res.tokenFee?.toString(),
        treasuryFee: res.treasuryFee?.toString(),
      })

      return {
        collateral: res.collateral,
        debt: res.debt,
        shares: res.shares,
        equity: res.equity,
        tokenFee: res.tokenFee,
        treasuryFee: res.treasuryFee,
      }
    },
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    // Keep behavior deterministic for keystroke-driven UX
    staleTime: 0,
  })

  // Map React Query statuses to the previous API surface
  const isLoading = enabled ? query.isPending || query.isFetching : false
  const data = query.data
  const error = query.error

  return { data, isLoading, error }
}

function useDebouncedBigint(value: bigint | undefined, delay: number) {
  const [debounced, setDebounced] = useState<bigint | undefined>(value)
  const id = useRef(0)
  useEffect(() => {
    const current = ++id.current
    const t = setTimeout(() => {
      if (current === id.current) setDebounced(value)
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
