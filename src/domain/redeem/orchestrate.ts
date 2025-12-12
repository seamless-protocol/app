/**
 * Orchestrator for leverage token redemption.
 *
 * Responsibilities:
 * - Plan flow (collateral->debt swap for debt repayment) and execute
 * - Return transaction details and plan information
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { hasVeloraData } from '@/domain/shared/adapters/types'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  contractAddresses,
  getContractAddresses,
  type SupportedChainId,
} from '@/lib/contracts/addresses'
import { executeRedeem } from './exec/execute'
import { executeRedeemWithVelora } from './exec/execute.velora'
import type { RedeemPlan } from './planner/plan'

// Keep parameter types simple to avoid brittle codegen coupling
type TokenArg = Address
type AccountArg = Address

// Result type for orchestrated redeems
export type OrchestrateRedeemResult = {
  hash: Hash
  plan: RedeemPlan
}

/**
 * Orchestrates a leverage-token redeem.
 *
 * Behavior
 * - Executes a pre-computed redeem plan.
 * - Caller must provide the plan from planRedeem().
 *
 * CRITICAL: Plan must be computed in the same UI flow that calls this function.
 * This ensures preview values match execution (see redeem-modal-plan-preview.md).
 *
 * Parameters
 * @param params.config Wagmi `Config` used by generated actions for chain/account wiring.
 * @param params.account EOA that signs and submits transactions (hex address string).
 * @param params.token Leverage token tuple argument as required by generated actions.
 * @param params.plan Pre-computed redeem plan from planRedeem().
 *
 * Returns
 * - `{ hash, plan }` with transaction hash and execution plan.
 *
 * Throws
 * - If redemption fails due to insufficient collateral or other constraints.
 */
export async function orchestrateRedeem(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  plan: RedeemPlan
  /** Optional overrides when using VNet/custom deployments */
  routerAddress?: Address
  managerAddress?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<OrchestrateRedeemResult> {
  const { config, account, token, plan, chainId } = params

  const adapterType =
    getLeverageTokenConfig(token, chainId)?.swaps?.collateralToDebt?.type ?? 'velora'

  const envRouter = import.meta.env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
  // Resolve chain-scoped addresses first (respects Tenderly overrides), then allow explicit/env overrides
  const chainAddresses = getContractAddresses(chainId)
  const routerAddress = params.routerAddress || chainAddresses.leverageRouterV2 || envRouter
  if (!routerAddress) {
    throw new Error(`LeverageRouterV2 address required on chain ${chainId}`)
  }

  if (adapterType === 'velora') {
    const veloraAdapterAddress = chainAddresses.veloraAdapter
    if (!veloraAdapterAddress) {
      throw new Error(`Velora adapter address required on chain ${chainId}`)
    }

    const quote = plan.collateralToDebtQuote
    if (!hasVeloraData(quote)) {
      throw new Error('Velora quote missing veloraData for exactOut operation')
    }
    const { augustus, offsets } = quote.veloraData
    if (quote.calls.length !== 1) {
      throw new Error('Velora quote must have exactly one call for redeem')
    }
    const swapCall = quote.calls[0]
    if (!swapCall) {
      throw new Error('Velora quote missing call data for redeem')
    }

    const tx = await executeRedeemWithVelora({
      config,
      token,
      account,
      sharesToRedeem: plan.sharesToRedeem,
      minCollateralForSender: plan.minCollateralForSender,
      veloraAdapter: veloraAdapterAddress,
      augustus,
      offsets,
      swapData: swapCall.data,
      routerAddress: routerAddress,
      chainId: chainId as SupportedChainId,
    })
    return { plan, ...tx }
  }

  const tx = await executeRedeem({
    config,
    token,
    account,
    sharesToRedeem: plan.sharesToRedeem,
    minCollateralForSender: plan.minCollateralForSender,
    multicallExecutor:
      (getContractAddresses(chainId).multicallExecutor as Address | undefined) ||
      (typeof import.meta !== 'undefined'
        ? ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.[
            'VITE_MULTICALL_EXECUTOR_ADDRESS'
          ] as Address | undefined)
        : undefined) ||
      (typeof process !== 'undefined'
        ? (process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] as Address | undefined)
        : undefined) ||
      ((): Address => {
        throw new Error(`Multicall executor address required on chain ${chainId}`)
      })(),
    swapCalls: plan.calls,
    routerAddress:
      routerAddress ||
      (contractAddresses[chainId]?.leverageRouterV2 as Address | undefined) ||
      (() => {
        throw new Error(`LeverageRouterV2 address required on chain ${chainId}`)
      })(),
    chainId,
  })
  return { plan, ...tx }
}

/**
 * Determines the quote intent (exactIn vs exactOut) based on the adapter type for REDEEM operations.
 *
 * IMPORTANT: This is specific to redemptions. Mints use a different intent (exactIn).
 *
 * Why exactOut for Velora redeems:
 * - Redeems use the `redeemWithVelora()` contract function which requires specific byte offsets
 *   to read swap parameters from the calldata (augustus address, exactAmount, limitAmount, quotedAmount)
 * - These offsets are only valid for ParaSwap BUY (exactOut) methods like swapExactAmountOut
 * - SELL (exactIn) methods have different calldata structures, so offsets wouldn't work
 * - See: https://github.com/seamless-protocol/leverage-tokens/blob/audit-fixes/test/integration/8453/LeverageRouter/RedeemWithVelora.t.sol#L19
 *
 * Why exactIn for other adapters:
 * - LiFi, UniswapV2, UniswapV3 use the standard `redeem()` function which passes raw calldata through
 * - No offsets needed, so we can use exactIn which is generally more responsive for quote APIs
 *
 * Note: Mints always use exactIn (even for Velora) because the `deposit()` function doesn't need offsets.
 */
export const getQuoteIntentForAdapter = (
  adapterType: CollateralToDebtSwapConfig['type'],
): 'exactOut' | 'exactIn' => {
  switch (adapterType) {
    case 'velora':
      return 'exactOut'
    default:
      return 'exactIn'
  }
}
