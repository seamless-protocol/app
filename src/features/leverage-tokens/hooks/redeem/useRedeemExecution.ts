import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useChainId, usePublicClient, useSwitchChain } from 'wagmi'
import type { OrchestrateRedeemResult } from '@/domain/redeem'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
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
  outputAsset?: Address
}

export function useRedeemExecution({
  token,
  account,
  slippageBps,
  chainId,
  routerAddress,
  managerAddress,
  swap,
  outputAsset,
}: UseRedeemExecutionParams) {
  const { switchChainAsync } = useSwitchChain()
  const activeChainId = useChainId()
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const publicClient = usePublicClient()

  const redeemWithRouter = useRedeemWithRouter()

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
    slippageBps,
    requiresQuote,
  })

  const canSubmit = useMemo(() => Boolean(account), [account])
  const quoteReady = !requiresQuote || quoteStatus === 'ready' || quoteStatus === 'not-required'
  const effectiveCanSubmit = canSubmit && quoteReady

  const redeem = useCallback(
    async (sharesToRedeem: bigint): Promise<OrchestrateRedeemResult> => {
      if (!account) throw new Error('No account')
      if (requiresQuote && quoteStatus !== 'ready') {
        const baseError =
          quoteError?.message || 'Unable to initialize swap quote for router v2 redeem.'
        throw new Error(baseError)
      }

      setStatus('submitting')
      setError(undefined)
      try {
        if (activeChainId !== chainId) {
          await switchChainAsync({ chainId })
        }

        if (!quote) {
          throw new Error('Quote is required for V2 redeem')
        }

        const result = await redeemWithRouter.mutateAsync({
          token,
          account,
          sharesToRedeem,
          slippageBps,
          chainId,
          quoteCollateralToDebt: quote,
          ...(typeof routerAddress !== 'undefined' ? { routerAddress } : {}),
          ...(typeof managerAddress !== 'undefined' ? { managerAddress } : {}),
          ...(typeof outputAsset !== 'undefined' ? { outputAsset } : {}),
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
      quote,
      quoteError?.message,
      quoteStatus,
      redeemWithRouter,
      routerAddress,
      slippageBps,
      outputAsset,
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
