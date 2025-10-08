import type { Address } from 'viem'
import type { Config } from 'wagmi'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { readLeverageRouterV2PreviewDeposit } from '@/lib/contracts/generated'

export interface ManagerPort {
  /**
   * Ideal preview using only the user's collateral contribution.
   * Returns targetCollateral, idealDebt, idealShares.
   */
  idealPreview(args: { token: Address; userCollateral: bigint; chainId: number }): Promise<{
    targetCollateral: bigint
    idealDebt: bigint
    idealShares: bigint
  }>

  /**
   * Final preview using total collateral (user + swap out).
   * For Router V2 flows, minted shares and debt are determined solely by the
   * user's equity contribution; the router computes the flash loan & swap.
   * Returns previewDebt, previewShares for the provided user collateral.
   */
  finalPreview(args: { token: Address; userCollateral: bigint; chainId: number }): Promise<{
    previewDebt: bigint
    previewShares: bigint
  }>
}

/**
 * ManagerPort for V2 deployments (Tenderly VNet).
 * - idealPreview prefers router.previewDeposit
 * - finalPreview uses manager.previewDeposit
 */
export function createManagerPortV2(params: { config: Config; routerAddress: Address }): ManagerPort {
  const { config, routerAddress } = params
  if (!routerAddress) throw new Error('Router address is required for V2 previews')

  return {
    async idealPreview({ token, userCollateral, chainId }) {
      const routerPreview = await readLeverageRouterV2PreviewDeposit(config, {
        args: [token, userCollateral],
        chainId: chainId as SupportedChainId,
      })
      return {
        targetCollateral: routerPreview.collateral,
        idealDebt: routerPreview.debt,
        idealShares: routerPreview.shares,
      }
    },

    async finalPreview({ token, userCollateral, chainId }) {
      const routerPreview = await readLeverageRouterV2PreviewDeposit(config, {
        args: [token, userCollateral],
        chainId: chainId as SupportedChainId,
      })
      return { previewDebt: routerPreview.debt, previewShares: routerPreview.shares }
    },
  }
}
