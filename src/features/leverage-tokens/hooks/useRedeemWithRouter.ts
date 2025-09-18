/**
 * React Query hook wrapping the domain-level orchestrateRedeem.
 *
 * Return type is discriminated by `routerVersion`:
 * - v1: { routerVersion: 'v1', hash, preview }
 * - v2: { routerVersion: 'v2', hash, plan }
 *
 * Optional params:
 * - `slippageBps` tunes redeem behavior
 * - V2 requires `quoteCollateralToDebt` for debt repayment swaps
 */
import { useMutation } from '@tanstack/react-query'
import type { Address } from 'viem'
import { useConfig } from 'wagmi'
import { type OrchestrateRedeemResult, orchestrateRedeem, type QuoteFn } from '@/domain/redeem'

type Gen = typeof import('@/lib/contracts/generated')

type TokenArg = Parameters<Gen['readLeverageManagerV2PreviewRedeem']>[1]['args'][0]
type AccountArg = Address
type SharesToRedeemArg = bigint

export interface UseRedeemWithRouterParams {
  token: TokenArg
  account: AccountArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps?: number

  quoteCollateralToDebt?: QuoteFn
}

/**
 * Thin hook wrapper around the domain-level orchestrateRedeem.
 */
export function useRedeemWithRouter() {
  const config = useConfig()
  return useMutation<OrchestrateRedeemResult, Error, UseRedeemWithRouterParams>({
    mutationFn: async ({
      token,
      account,
      sharesToRedeem,
      slippageBps,
      quoteCollateralToDebt,
    }) =>
      orchestrateRedeem({
        config,
        account,
        token,
        sharesToRedeem,
        ...(typeof slippageBps !== 'undefined' ? { slippageBps } : {}),
        ...(typeof quoteCollateralToDebt !== 'undefined' ? { quoteCollateralToDebt } : {}),
      }),
  })
}
