import { useCallback, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { usePublicClient } from 'wagmi'
import { useRedeemWithRouter } from '../useRedeemWithRouter'
import { createLifiQuoteAdapter, createUniswapV2QuoteAdapter } from '@/domain/shared/adapters'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { BASE_WETH } from '@/lib/contracts/addresses'

type Status = 'idle' | 'submitting' | 'pending' | 'success' | 'error'

export function useRedeemExecution(params: {
  token: Address
  account?: Address
  slippageBps: number
  chainId?: number
}) {
  const { token, account, slippageBps, chainId } = params
  const [status, setStatus] = useState<Status>('idle')
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const publicClient = usePublicClient()
  const redeemWithRouter = useRedeemWithRouter()

  const canSubmit = useMemo(() => Boolean(account), [account])

  // Create quote function for V2 router
  const quoteCollateralToDebt = useMemo(() => {
    if (!publicClient || !chainId) return undefined

    const contractAddresses = getContractAddresses(chainId)
    const routerV2 = contractAddresses.leverageRouterV2
    if (!routerV2) return undefined

    // Use LiFi by default, fallback to UniswapV2 if needed
    const useLiFi = import.meta.env['VITE_USE_LIFI'] !== 'false'
    
    if (useLiFi) {
      return createLifiQuoteAdapter({
        chainId,
        router: routerV2,
        allowBridges: 'none',
      })
    } else {
      // Fallback to UniswapV2 - would need a router address
      const uniswapRouter = import.meta.env['VITE_UNISWAP_V2_ROUTER'] as Address | undefined
      if (!uniswapRouter) return undefined

      return createUniswapV2QuoteAdapter({
        publicClient: publicClient as any, // Type compatibility issue - using any for now
        router: uniswapRouter,
        recipient: routerV2,
        wrappedNative: BASE_WETH,
      })
    }
  }, [publicClient, chainId])

  const redeem = useCallback(
    async (sharesToRedeem: bigint) => {
      if (!account) throw new Error('No account')
      setStatus('submitting')
      setError(undefined)
      try {
        const result = await redeemWithRouter.mutateAsync({
          token,
          account,
          sharesToRedeem,
          slippageBps,
          quoteCollateralToDebt,
        })
        
        setHash(result.hash)
        setStatus('pending')
        await publicClient?.waitForTransactionReceipt({ hash: result.hash })
        setStatus('success')
        return result.hash
      } catch (e: unknown) {
        setError(e as Error)
        setStatus('error')
        throw e
      }
    },
    [account, token, slippageBps, quoteCollateralToDebt, redeemWithRouter, publicClient],
  )

  return { 
    redeem, 
    status: redeemWithRouter.isPending ? 'submitting' : status, 
    hash, 
    error: redeemWithRouter.error || error, 
    canSubmit 
  }
}
