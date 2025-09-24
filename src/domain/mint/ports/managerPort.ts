import type { Address } from 'viem'
import type { Config } from 'wagmi'
import {
  // V2 manager reads
  readLeverageManagerV2PreviewDeposit,
  readLeverageManagerV2PreviewMint,
  // V2 router read (for ideal preview when available)
  readLeverageRouterV2PreviewDeposit,
} from '@/lib/contracts/generated'

export interface ManagerPort {
  /**
   * Ideal preview using only the user's collateral contribution.
   * Returns targetCollateral, idealDebt, idealShares.
   */
  idealPreview(args: { token: Address; userCollateral: bigint }): Promise<{
    targetCollateral: bigint
    idealDebt: bigint
    idealShares: bigint
  }>

  /**
   * Final preview using total collateral (user + swap out).
   * Returns previewDebt, previewShares.
   */
  finalPreview(args: { token: Address; totalCollateral: bigint }): Promise<{
    previewDebt: bigint
    previewShares: bigint
  }>
}

/**
 * ManagerPort for V2 deployments (Tenderly VNet).
 * - idealPreview prefers router.previewDeposit
 * - finalPreview uses manager.previewDeposit
 */
export function createManagerPortV2(params: {
  config: Config
  managerAddress?: Address
  routerAddress?: Address
}): ManagerPort {
  const { config, managerAddress, routerAddress } = params

  return {
    async idealPreview({ token, userCollateral }) {
      if (routerAddress) {
        const routerPreview = await readLeverageRouterV2PreviewDeposit(config, {
          address: routerAddress,
          args: [token, userCollateral],
        })
        return {
          targetCollateral: routerPreview.collateral,
          idealDebt: routerPreview.debt,
          idealShares: routerPreview.shares,
        }
      }
      const managerPreview = await readLeverageManagerV2PreviewMint(config, {
        ...(managerAddress ? { address: managerAddress } : {}),
        args: [token, userCollateral],
      })
      return {
        targetCollateral: managerPreview.collateral,
        idealDebt: managerPreview.debt,
        idealShares: managerPreview.shares,
      }
    },

    async finalPreview({ token, totalCollateral }) {
      const managerPreview = await readLeverageManagerV2PreviewDeposit(config, {
        ...(managerAddress ? { address: managerAddress } : {}),
        args: [token, totalCollateral],
      })
      return {
        previewDebt: managerPreview.debt,
        previewShares: managerPreview.shares,
      }
    },
  }
}
