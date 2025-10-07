/**
 * React Query hook wrapping the domain-level orchestrateRedeem.
 *
 * Returns { hash, plan } with transaction hash and execution plan.
 *
 * Optional params:
 * - `slippageBps` tunes redeem behavior
 * - Requires `quoteCollateralToDebt` for debt repayment swaps
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
  chainId: number

  quoteCollateralToDebt: QuoteFn
  routerAddress?: Address
  managerAddress?: Address
  outputAsset?: Address
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
      chainId,
      quoteCollateralToDebt,
      routerAddress,
      managerAddress,
      outputAsset,
    }) =>
      orchestrateRedeem({
        config,
        account,
        token,
        sharesToRedeem,
        chainId,
        ...(typeof slippageBps !== 'undefined' ? { slippageBps } : {}),
        quoteCollateralToDebt,
        ...(typeof routerAddress !== 'undefined' ? { routerAddressV2: routerAddress } : {}),
        ...(typeof managerAddress !== 'undefined' ? { managerAddressV2: managerAddress } : {}),
        ...(typeof outputAsset !== 'undefined' ? { outputAsset } : {}),
      }),
  })
}
