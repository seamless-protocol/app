/**
 * React Query hook wrapping the domain-level orchestrateRedeem.
 *
 * Returns { hash, plan } with transaction hash and execution plan.
 *
 * CRITICAL: Caller must provide a pre-computed plan from planRedeem().
 * This ensures preview values match execution (see redeem-modal-plan-preview.md).
 */
import { useMutation } from '@tanstack/react-query'
import type { Address } from 'viem'
import { useConfig } from 'wagmi'
import {
  type OrchestrateRedeemResult,
  orchestrateRedeem,
  orchestrateRedeemWithVelora,
  type RedeemPlan,
} from '@/domain/redeem'
import type { SupportedChainId } from '@/lib/contracts/addresses'

type Gen = typeof import('@/lib/contracts/generated')

type TokenArg = Parameters<Gen['readLeverageManagerV2PreviewRedeem']>[1]['args'][0]
type AccountArg = Address

export interface UseRedeemWithRouterParams {
  token: TokenArg
  account: AccountArg
  plan: RedeemPlan
  chainId: number

  routerAddress?: Address
  managerAddress?: Address
}

/**
 * Thin hook wrapper around the domain-level orchestrateRedeem.
 */
export function useRedeemWithRouter(swapType?: string) {
  const config = useConfig()
  return useMutation<OrchestrateRedeemResult, Error, UseRedeemWithRouterParams>({
    mutationFn: async ({ token, account, plan, chainId, routerAddress, managerAddress }) => {
      if (swapType === 'balmy') {
        return orchestrateRedeemWithVelora({
          config,
          account,
          token,
          plan,
          chainId: chainId as SupportedChainId,
          ...(typeof routerAddress !== 'undefined' ? { routerAddress } : {}),
          ...(typeof managerAddress !== 'undefined' ? { managerAddress } : {}),
        })
      } else {
        return orchestrateRedeem({
          config,
          account,
          token,
          plan,
          chainId,
          ...(typeof routerAddress !== 'undefined' ? { routerAddress } : {}),
          ...(typeof managerAddress !== 'undefined' ? { managerAddress } : {}),
        })
      }
    },
  })
}
