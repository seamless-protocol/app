import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useConfig, usePublicClient } from 'wagmi'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

// TODO: Create orchestrateRedeem function in domain layer
async function orchestrateRedeem(params: {
  config: any
  account: Address
  token: Address
  sharesToRedeem: bigint
  outputAsset: Address
}): Promise<{ hash: `0x${string}` }> {
  // Placeholder implementation - this should be replaced with real orchestrateRedeem
  throw new Error('orchestrateRedeem not implemented yet')
}

export function useRedeemExecution(params: {
  token: Address
  account?: Address
  outputAsset: Address // collateral asset
}) {
  const { token, account, outputAsset } = params
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
          outputAsset,
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
    [account, config, token, outputAsset, publicClient],
  )

  return { redeem, status, hash, error, canSubmit }
}
