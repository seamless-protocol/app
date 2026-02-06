import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useChainId, usePublicClient, useSwitchChain } from 'wagmi'
import type { OrchestrateRedeemResult } from '@/domain/redeem'
import type { RedeemPlan } from '@/domain/redeem/planner/plan'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { useRedeemWithRouter } from '../useRedeemWithRouter'
import { type QuoteStatus, useCollateralToDebtQuote } from './useCollateralToDebtQuote'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

interface UseRedeemExecutionParams {
  token: Address
  account?: Address
  chainId: SupportedChainId
  routerAddress?: Address
  managerAddress?: Address
  swap?: CollateralToDebtSwapConfig
}

export function useRedeemExecution({
  token,
  account,
  chainId,
  routerAddress,
  managerAddress,
  swap,
}: UseRedeemExecutionParams) {
  const { switchChainAsync } = useSwitchChain()
  const activeChainId = useChainId()
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const publicClient = usePublicClient()

  const redeemWithRouter = useRedeemWithRouter(swap?.type)

  // V2 always requires a quote
  const requiresQuote = true

  const {
    quote,
    status: quoteStatus,
    error: quoteError,
  } = useCollateralToDebtQuote({
    chainId,
    ...(routerAddress ? { routerAddress } : {}),
    ...(swap ? { swap } : {}),
    requiresQuote,
  })

  const canSubmit = useMemo(() => Boolean(account), [account])
  const quoteReady = !requiresQuote || quoteStatus === 'ready' || quoteStatus === 'not-required'
  const effectiveCanSubmit = canSubmit && quoteReady

  const redeem = useCallback(
    async (plan: RedeemPlan): Promise<OrchestrateRedeemResult> => {
      if (!account) throw new Error('No account')

      setStatus('submitting')
      setError(undefined)
      try {
        if (activeChainId !== chainId) {
          await switchChainAsync({ chainId })
        }

        const result = await redeemWithRouter.mutateAsync({
          token,
          account,
          plan,
          chainId,
          ...(typeof routerAddress !== 'undefined' ? { routerAddress } : {}),
          ...(typeof managerAddress !== 'undefined' ? { managerAddress } : {}),
        })

        setHash(result.hash)
        setStatus('pending')
        const receipt = await publicClient?.waitForTransactionReceipt({ hash: result.hash })
        if (receipt && receipt.status !== 'success') {
          const revertError = new Error('Transaction reverted')
          setError(revertError)
          setStatus('error')
          throw revertError
        }
        setStatus('success')
        return result
      } catch (err) {
        const nextError = err instanceof Error ? err : new Error(String(err))
        setError(nextError)
        setStatus('error')
        throw nextError
      }
    },
    [
      account,
      activeChainId,
      managerAddress,
      redeemWithRouter,
      routerAddress,
      token,
      publicClient,
      chainId,
      switchChainAsync,
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
    quote,
  }
}

export type { QuoteStatus }
