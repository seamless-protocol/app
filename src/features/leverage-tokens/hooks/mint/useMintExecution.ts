import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { createPublicClient, http } from 'viem'
import { useConfig, usePublicClient } from 'wagmi'
import { base } from 'wagmi/chains'
import { orchestrateMint } from '@/domain/mint'
import { mintRedeemRpcUrl, isMintRedeemTestModeEnabled } from '@/lib/config/tenderly.config'

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
  const wagmiPublicClient = usePublicClient()

  // Create custom public client for Tenderly if in test mode
  const tenderlyPublicClient = useMemo(() => {
    if (!isMintRedeemTestModeEnabled) return null
    return createPublicClient({
      chain: base,
      transport: http(mintRedeemRpcUrl),
    })
  }, [])

  // Use Tenderly client if available, otherwise use wagmi client
  const publicClient = tenderlyPublicClient || wagmiPublicClient

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
    isUsingTenderly: isMintRedeemTestModeEnabled,
    rpcUrl: mintRedeemRpcUrl,
  }
}
