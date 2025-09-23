import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useConfig, usePublicClient } from 'wagmi'
import { orchestrateMint } from '@/domain/mint'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

export function useMintExecution(params: {
  token: Address
  account?: Address
  inputAsset: Address // collateral asset
  slippageBps: number
}) {
  const { token, account, inputAsset, slippageBps } = params
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const config = useConfig()
  const publicClient = usePublicClient()

  const canSubmit = useMemo(() => Boolean(account), [account])

  const mint = useCallback(
    async (equityInInputAsset: bigint) => {
      if (!account) throw new Error('No account')
      setStatus('submitting')
      setError(undefined)
      try {
        const { hash } = await orchestrateMint({
          config,
          account,
          token,
          inputAsset,
          equityInInputAsset,
          slippageBps,
        })
        setHash(hash)
        setStatus('pending')
        await publicClient?.waitForTransactionReceipt({ hash })
        setStatus('success')
        return hash
      } catch (e: unknown) {
        setError(e as Error)
        setStatus('error')
        throw e
      }
    },
    [account, config, token, inputAsset, slippageBps, publicClient],
  )

  return {
    mint,
    status,
    hash,
    error,
    canSubmit,
  }
}
