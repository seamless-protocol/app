import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { createPublicClient, http } from 'viem'
import { usePublicClient } from 'wagmi'
import { base } from 'wagmi/chains'
import { RouterVersion } from '@/domain/redeem/planner/types'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { detectRedeemRouterVersion } from '@/domain/redeem/utils/detectVersion'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { mintRedeemRpcUrl, isMintRedeemTestModeEnabled } from '@/lib/config/tenderly.config'
import { useRedeemWithRouter } from '../useRedeemWithRouter'
import { type QuoteStatus, useCollateralToDebtQuote } from './useCollateralToDebtQuote'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

interface UseRedeemExecutionParams {
  token: Address
  account?: Address
  slippageBps: number
  chainId: SupportedChainId
  routerAddress?: Address
  managerAddress?: Address
  swap?: CollateralToDebtSwapConfig
}

export function useRedeemExecution({
  token,
  account,
  slippageBps,
  chainId,
  routerAddress,
  managerAddress,
  swap,
}: UseRedeemExecutionParams) {
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

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

  const redeemWithRouter = useRedeemWithRouter()

  const routerVersion = detectRedeemRouterVersion()
  const requiresQuote = routerVersion === RouterVersion.V2

  const {
    quote,
    status: quoteStatus,
    error: quoteError,
  } = useCollateralToDebtQuote({
    chainId,
    ...(routerAddress ? { routerAddress } : {}),
    ...(swap ? { swap } : {}),
    slippageBps,
    requiresQuote,
  })

  const canSubmit = useMemo(() => Boolean(account), [account])
  const quoteReady = !requiresQuote || quoteStatus === 'ready' || quoteStatus === 'not-required'
  const effectiveCanSubmit = canSubmit && quoteReady

  const redeem = useCallback(
    async (sharesToRedeem: bigint) => {
      if (!account) throw new Error('No account')
      if (requiresQuote && quoteStatus !== 'ready') {
        const baseError =
          quoteError?.message || 'Unable to initialize swap quote for router v2 redeem.'
        throw new Error(baseError)
      }

      setStatus('submitting')
      setError(undefined)
      try {
        const result = await redeemWithRouter.mutateAsync({
          token,
          account,
          sharesToRedeem,
          slippageBps,
          ...(quote ? { quoteCollateralToDebt: quote } : {}),
          ...(typeof routerAddress !== 'undefined' ? { routerAddress } : {}),
          ...(typeof managerAddress !== 'undefined' ? { managerAddress } : {}),
        })

        setHash(result.hash)
        setStatus('pending')
        await publicClient?.waitForTransactionReceipt({ hash: result.hash })
        setStatus('success')
        return result.hash
      } catch (err) {
        const nextError = err instanceof Error ? err : new Error(String(err))
        setError(nextError)
        setStatus('error')
        throw nextError
      }
    },
    [
      account,
      managerAddress,
      quote,
      quoteError?.message,
      quoteStatus,
      redeemWithRouter,
      requiresQuote,
      routerAddress,
      slippageBps,
      token,
      publicClient,
    ],
  )

  return {
    redeem,
    status: redeemWithRouter.isPending ? 'submitting' : status,
    hash,
    error: redeemWithRouter.error || error,
    canSubmit: effectiveCanSubmit,
    quoteStatus,
    quoteError,
    isUsingTenderly: isMintRedeemTestModeEnabled,
    rpcUrl: mintRedeemRpcUrl,
  }
}

export type { QuoteStatus }
