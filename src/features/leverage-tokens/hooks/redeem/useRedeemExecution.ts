import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { usePublicClient, useSwitchChain } from 'wagmi'
import type { OrchestrateRedeemResult } from '@/domain/redeem'
import { RouterVersion } from '@/domain/redeem/planner/types'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { detectRedeemRouterVersion } from '@/domain/redeem/utils/detectVersion'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { useRedeemWithRouter } from '../useRedeemWithRouter'
import { type QuoteStatus, useCollateralToDebtQuote } from './useCollateralToDebtQuote'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

interface UseRedeemExecutionParams {
  token: Address
  account?: Address
  slippageBps: number
  chainId: SupportedChainId
  targetChainId: number
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
  targetChainId,
  routerAddress,
  managerAddress,
  swap,
  outputAsset,
}: UseRedeemExecutionParams) {
  const { switchChainAsync } = useSwitchChain()
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const publicClient = usePublicClient()

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
        if (chainId !== targetChainId) {
          await switchChainAsync({ chainId: targetChainId })
        }

        const result = await redeemWithRouter.mutateAsync({
          token,
          account,
          sharesToRedeem,
          slippageBps,
          ...(quote ? { quoteCollateralToDebt: quote } : {}),
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
      managerAddress,
      quote,
      quoteError?.message,
      quoteStatus,
      redeemWithRouter,
      requiresQuote,
      routerAddress,
      slippageBps,
      outputAsset,
      token,
      publicClient,
      chainId,
      targetChainId,
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
    routerVersion,
  }
}

export type { QuoteStatus }
