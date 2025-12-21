/**
 * Orchestrator for leverage token redemption.
 *
 * Responsibilities:
 * - Plan flow (collateral->debt swap for debt repayment) and execute
 * - Return transaction details and plan information
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import { contractAddresses, getContractAddresses } from '@/lib/contracts/addresses'
import { executeRedeem } from './exec/execute'
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

  const envRouter = import.meta.env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
  // Resolve chain-scoped addresses first (respects Tenderly overrides), then allow explicit/env overrides
  const chainAddresses = getContractAddresses(chainId)
  const routerAddress = params.routerAddress || chainAddresses.leverageRouterV2 || envRouter
  if (!routerAddress) {
    throw new Error(`LeverageRouterV2 address required on chain ${chainId}`)
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
