import { useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { readLeverageManagerPreviewMint } from '@/lib/contracts/generated'

type Preview = Awaited<ReturnType<typeof readLeverageManagerPreviewMint>>

export function useMintPreview(params: {
  config: Config
  token: Address
  equityInCollateralAsset: bigint | undefined
  debounceMs?: number
}) {
  const { config, token, equityInCollateralAsset, debounceMs = 350 } = params
  const [data, setData] = useState<Preview | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)
  const reqId = useRef(0)

  const canFetch = useMemo(
    () => typeof equityInCollateralAsset === 'bigint' && equityInCollateralAsset > 0n,
    [equityInCollateralAsset],
  )

  useEffect(() => {
    if (!canFetch) {
      setData(undefined)
      setError(undefined)
      setIsLoading(false)
      return
    }
    const id = ++reqId.current
    setIsLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await readLeverageManagerPreviewMint(config, {
          args: [token, equityInCollateralAsset as bigint],
        })
        if (id === reqId.current) {
          setData(res)
          setError(undefined)
        }
      } catch (e: unknown) {
        if (id === reqId.current) {
          setError(e as Error)
          setData(undefined)
        }
      } finally {
        if (id === reqId.current) setIsLoading(false)
      }
    }, debounceMs)
    return () => clearTimeout(t)
  }, [config, token, equityInCollateralAsset, debounceMs, canFetch])

  return { data, isLoading, error }
}
