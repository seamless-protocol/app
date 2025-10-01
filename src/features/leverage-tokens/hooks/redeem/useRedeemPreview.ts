import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import { readLeverageManagerV2PreviewRedeem } from '@/lib/contracts/generated'

export interface RedeemPreviewResult {
  collateral: bigint
  debt: bigint
  shares: bigint
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

  // Local debounce of the raw bigint input so the query only runs after idle
  const debounced = useDebouncedBigint(sharesToRedeem, debounceMs)
  const enabled = useMemo(() => typeof debounced === 'bigint' && debounced > 0n, [debounced])

  // Derive active chain id from wagmi config for multi-chain cache isolation
  const detectedChainId = chainId ?? getPublicClient(config)?.chain?.id
  const contracts = detectedChainId ? getContractAddresses(detectedChainId) : undefined
  const managerV2Address = contracts?.leverageManagerV2

  const amountForKey = enabled && typeof debounced === 'bigint' ? (debounced as bigint) : 0n
  const queryKey = ltKeys.simulation.redeemKey({
    chainId: detectedChainId,
    addr: token,
    amount: amountForKey,
  })

  const query = useQuery<RedeemPreviewResult, Error>({
    queryKey,
    queryFn: async () => {
      if (!managerV2Address || typeof debounced !== 'bigint') {
        throw new Error('Redeem preview unavailable: manager V2 address or input missing')
      }

      const res = await readLeverageManagerV2PreviewRedeem(config, {
        args: [token, debounced],
        chainId: detectedChainId as SupportedChainId,
      })

      return {
        collateral: res.collateral,
        debt: res.debt,
        shares: res.shares,
        tokenFee: res.tokenFee,
        treasuryFee: res.treasuryFee,
      }
    },
    enabled: enabled && Boolean(managerV2Address),
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
