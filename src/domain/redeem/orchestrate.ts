/**
 * Orchestrator for leverage token redemption across router versions.
 *
 * Responsibilities:
 * - Detect router version (env override or runtime probe)
 * - Plan V2 flow (collateral->debt swap for debt repayment) and execute
 * - Enforce V1 invariant (simple redemption) and execute
 * - Return a discriminated result including version and tx details
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import { contractAddresses, getContractAddresses } from '@/lib/contracts/addresses'
import { executeRedeemV1 } from './exec/execute.v1'
import { executeRedeemV2 } from './exec/execute.v2'
import { planRedeemV2 } from './planner/plan.v2'
import { type QuoteFn, RouterVersion } from './planner/types'
import { DEFAULT_SLIPPAGE_BPS } from './utils/constants'
import { detectRedeemRouterVersion } from './utils/detectVersion'

// Keep parameter types simple to avoid brittle codegen coupling
type TokenArg = Address
type AccountArg = Address
type SharesToRedeemArg = bigint

// Discriminated result type for orchestrated redeems
export type OrchestrateRedeemResult =
  | {
      routerVersion: 'v1'
      hash: Hash
      preview: { collateral: bigint; debt: bigint; shares: bigint }
    }
  | {
      routerVersion: 'v2'
      hash: Hash
      plan: ReturnType<typeof planRedeemV2> extends Promise<infer P> ? P : never
    }

/**
 * Orchestrates a leverage-token redeem by selecting the appropriate router flow (V1 or V2).
 *
 * Behavior
 * - Detects the router version at runtime (with optional env override inside `detectRouterVersion`).
 * - V2: Plans the redeem (swapping collateral->debt for debt repayment), then executes.
 * - V1: Executes a simple redeem path.
 *
 * Requirements
 * - Router V2 requires a `quoteCollateralToDebt` function for debt repayment swaps.
 * - Router V1 ignores quote functions and executes simple redemption.
 *
 * Parameters
 * @param params.config Wagmi `Config` used by generated actions for chain/account wiring.
 * @param params.account EOA that signs and submits transactions (hex address string).
 * @param params.token Leverage token tuple argument as required by generated actions.
 * @param params.sharesToRedeem Number of leverage token shares to redeem.
 * @param params.slippageBps Optional slippage tolerance in basis points (default 50 = 0.50%).
 * @param params.quoteCollateralToDebt Required for V2. Quotes amount of debt received for a given collateral amount.
 *
 * Returns
 * - Discriminated union by `routerVersion`:
 *   - `v1`: `{ routerVersion: 'v1', hash, preview }`
 *   - `v2`: `{ routerVersion: 'v2', hash, plan }`
 *
 * Throws
 * - If router V2 is selected and `quoteCollateralToDebt` is not provided.
 * - If redemption fails due to insufficient collateral or other constraints.
 *
 * Example usage
 * - Returns `{ routerVersion: 'v1' | 'v2', hash, ... }` depending on runtime detection.
 */
export async function orchestrateRedeem(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps?: number
  quoteCollateralToDebt?: QuoteFn
  /** Optional overrides for V2 when using VNet/custom deployments */
  routerAddressV2?: Address
  managerAddressV2?: Address
  /** Optional override for the desired payout asset (defaults to collateral). */
  outputAsset?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<OrchestrateRedeemResult> {
  const {
    config,
    account,
    token,
    sharesToRedeem,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    quoteCollateralToDebt,
    outputAsset,
    chainId,
  } = params

  const version = detectRedeemRouterVersion()

  if (version === RouterVersion.V2) {
    if (!quoteCollateralToDebt) throw new Error('quoteCollateralToDebt is required for router v2')
    const envRouterV2 = import.meta.env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
    const envManagerV2 = import.meta.env['VITE_MANAGER_V2_ADDRESS'] as Address | undefined
    // Resolve chain-scoped addresses first (respects Tenderly overrides), then allow explicit/env overrides
    const chainAddresses = getContractAddresses(chainId)
    const routerAddressV2 =
      params.routerAddressV2 ||
      (chainAddresses.leverageRouterV2 as Address | undefined) ||
      envRouterV2
    const managerAddressV2 =
      params.managerAddressV2 ||
      (chainAddresses.leverageManagerV2 as Address | undefined) ||
      envManagerV2

    const plan = await planRedeemV2({
      config,
      token,
      sharesToRedeem,
      slippageBps,
      quoteCollateralToDebt,
      chainId,
      ...(managerAddressV2 ? { managerAddress: managerAddressV2 } : {}),
      ...(outputAsset ? { outputAsset } : {}),
    })

    const tx = await executeRedeemV2({
      config,
      token,
      account,
      sharesToRedeem: plan.sharesToRedeem,
      minCollateralForSender: plan.minCollateralForSender,
      multicallExecutor:
        (getContractAddresses(chainId).multicall as Address | undefined) ||
        (typeof import.meta !== 'undefined'
          ? ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.[
              'VITE_MULTICALL_EXECUTOR_ADDRESS'
            ] as Address | undefined)
          : undefined) ||
        (typeof process !== 'undefined'
          ? (process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] as Address | undefined)
          : undefined) ||
        ((): Address => {
          throw new Error(
            `Multicall executor address required for router v2 flow on chain ${chainId}`,
          )
        })(),
      swapCalls: plan.calls,
      routerAddress:
        routerAddressV2 ||
        (contractAddresses[chainId]?.leverageRouterV2 as Address | undefined) ||
        (() => {
          throw new Error(
            `LeverageRouterV2 address required for router v2 flow on chain ${chainId}`,
          )
        })(),
      chainId,
    })
    return { routerVersion: 'v2' as const, plan, ...tx }
  }

  // V1 path
  const tx = await executeRedeemV1({
    config,
    account,
    token,
    sharesToRedeem,
    slippageBps,
  })
  return { routerVersion: 'v1' as const, ...tx }
}
