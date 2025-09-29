import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useEffect, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { readLeverageManagerV2PreviewDeposit } from '@/lib/contracts/generated'

type PreviewResult = {
  collateral: bigint
  debt: bigint
  shares: bigint
  tokenFee?: bigint
  treasuryFee?: bigint
}

export function useMintPreview(params: {
  config: Config
  token: Address
  equityInCollateralAsset: bigint | undefined
  chainId: number
  debounceMs?: number
}) {
  const { config, token, equityInCollateralAsset, debounceMs = 350, chainId } = params

  const debounced = useDebouncedBigint(equityInCollateralAsset, debounceMs)
  const hasValidInput = typeof debounced === 'bigint' && debounced > 0n

  const detectedChainId = chainId ?? getPublicClient(config)?.chain?.id
  const contracts = detectedChainId ? getContractAddresses(detectedChainId) : undefined
  const managerV2Address = contracts?.leverageManagerV2

  const amountForKey = hasValidInput && typeof debounced === 'bigint' ? debounced : 0n
  const queryKey = ltKeys.simulation.mintKey({
    chainId: detectedChainId,
    addr: token,
    amount: amountForKey,
  })

  const query = useQuery<PreviewResult, Error>({
    queryKey,
    enabled: hasValidInput && Boolean(managerV2Address) && Boolean(detectedChainId),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    queryFn: async () => {
      if (!managerV2Address) {
        throw new Error('Mint preview unavailable: manager V2 address missing')
      }
      if (typeof debounced !== 'bigint') {
        throw new Error('Mint preview unavailable: input missing')
      }

      const res = await readLeverageManagerV2PreviewDeposit(config, {
        address: managerV2Address,
        args: [token, debounced],
        chainId,
      })

      return {
        collateral: res.collateral,
        debt: res.debt,
        shares: res.shares,
        tokenFee: res.tokenFee,
        treasuryFee: res.treasuryFee,
      }
    },
  })

  const isLoading = hasValidInput && (query.isPending || query.isFetching)
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
