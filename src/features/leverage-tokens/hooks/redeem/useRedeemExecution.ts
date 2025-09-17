import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useConfig, usePublicClient } from 'wagmi'
import { orchestrateRedeem } from '@/domain/redeem/orchestrate'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

export function useRedeemExecution(params: {
  token: Address
  account?: Address
  slippageBps: number
}) {
  const { token, account, slippageBps } = params
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const config = useConfig()
  const publicClient = usePublicClient()

  const canSubmit = useMemo(() => Boolean(account), [account])

  const redeem = useCallback(
    async (sharesToRedeem: bigint) => {
      if (!account) throw new Error('No account')
      setStatus('submitting')
      setError(undefined)
      try {
        const { hash } = await orchestrateRedeem({
          config,
          account,
          token,
          sharesToRedeem,
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
    [account, config, token, slippageBps, publicClient],
  )

  return { redeem, status, hash, error, canSubmit }
}
