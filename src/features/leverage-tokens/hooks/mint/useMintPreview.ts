import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useEffect, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { RouterVersion } from '@/domain/mint/planner/types'
import { detectRouterVersion } from '@/domain/mint/utils/detectVersion'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { getContractAddresses } from '@/lib/contracts/addresses'
import {
  readLeverageManagerPreviewMint,
  readLeverageManagerV2PreviewDeposit,
} from '@/lib/contracts/generated'

type PreviewTuple = Awaited<ReturnType<typeof readLeverageManagerPreviewMint>>

type PreviewResult = {
  collateral: bigint
  debt: bigint
  shares: bigint
  equity?: bigint
  tokenFee?: bigint
  treasuryFee?: bigint
}

export function useMintPreview(params: {
  config: Config
  token: Address
  equityInCollateralAsset: bigint | undefined
  debounceMs?: number
  chainId?: number
}) {
  const { config, token, equityInCollateralAsset, debounceMs = 350, chainId } = params

  const debounced = useDebouncedBigint(equityInCollateralAsset, debounceMs)
  const hasValidInput = typeof debounced === 'bigint' && debounced > 0n

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

  const amountForKey = hasValidInput && typeof debounced === 'bigint' ? debounced : 0n
  const queryKey = ltKeys.simulation.mintKey({
    chainId: detectedChainId,
    addr: token,
    amount: amountForKey,
  })

  const query = useQuery<PreviewResult, Error>({
    queryKey,
    enabled: hasValidInput && Boolean(managerAddress) && Boolean(detectedChainId),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    queryFn: async () => {
      if (!managerAddress || typeof debounced !== 'bigint') {
        throw new Error('Mint preview unavailable: manager address or input missing')
      }

      if (useV2 && managerV2Address) {
        const res = await readLeverageManagerV2PreviewDeposit(config, {
          address: managerV2Address,
          args: [token, debounced],
        })
        return {
          collateral: res.collateral,
          debt: res.debt,
          shares: res.shares,
          tokenFee: res.tokenFee,
          treasuryFee: res.treasuryFee,
        }
      }

      const res: PreviewTuple = await readLeverageManagerPreviewMint(config, {
        ...(managerAddress ? { address: managerAddress } : {}),
        args: [token, debounced],
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
