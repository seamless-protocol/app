import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { RouterVersion } from '@/domain/redeem/planner/types'
import { detectRedeemRouterVersion } from '@/domain/redeem/utils/detectVersion'
import type { CollateralToDebtSwapConfig } from '@/features/leverage-tokens/leverageTokens.config'
import type { SupportedChainId } from '@/lib/contracts/addresses'
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
  }
}

export type { QuoteStatus }
