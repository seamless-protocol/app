/**
 * Orchestrator for leverage token minting.
 *
 * Responsibilities:
 * - Plan V2 flow (optional input->collateral conversion + debt swap) and execute
 * - Return transaction details and plan information
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import { contractAddresses, getContractAddresses } from '@/lib/contracts/addresses'
import { executeMintV2 } from './exec/execute.v2'
import { planMintV2 } from './planner/plan.v2'
import type { QuoteFn } from './planner/types'
// ManagerPort removed; planner uses router.previewDeposit directly
import { DEFAULT_SLIPPAGE_BPS } from './utils/constants'

// Keep parameter types simple to avoid brittle codegen coupling
type TokenArg = Address
type AccountArg = Address
type EquityInInputAssetArg = bigint
type MaxSwapCostArg = bigint

// Result type for orchestrated mints
export type OrchestrateMintResult = {
  hash: Hash
  plan: ReturnType<typeof planMintV2> extends Promise<infer P> ? P : never
}

/**
 * Orchestrates a leverage-token mint.
 *
 * Behavior
 * - Plans the mint (optionally converting input->collateral, and swapping debt->collateral), then executes.
 *
 * Requirements
 * - Requires a `quoteDebtToCollateral` function. If the input asset differs from the collateral asset,
 *   provide `quoteInputToCollateral` as well to enable the input->collateral conversion step in the plan.
 *
 * Parameters
 * @param params.config Wagmi `Config` used by generated actions for chain/account wiring.
 * @param params.account EOA that signs and submits transactions (hex address string).
 * @param params.token Leverage token tuple argument as required by generated actions.
 * @param params.inputAsset Address of the asset used as input for the mint (may equal collateral asset).
 * @param params.equityInInputAsset Equity amount expressed in the `inputAsset` units.
 * @param params.slippageBps Optional slippage tolerance in basis points (default 50 = 0.50%).
 * @param params.maxSwapCostInCollateralAsset Optional max swap cost, denominated in the collateral asset, forwarded to the router.
 * @param params.quoteDebtToCollateral Required. Quotes amount of collateral received for a given debt amount.
 * @param params.quoteInputToCollateral Optional. Quotes amount of collateral received for a given input asset amount when input != collateral.
 *
 * Returns
 * - `{ hash, plan }` with transaction hash and execution plan.
 *
 * Throws
 * - If `quoteDebtToCollateral` is not provided.
 * - If redemption fails due to insufficient collateral or other constraints.
 */
export async function orchestrateMint(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  inputAsset: Address
  equityInInputAsset: EquityInInputAssetArg
  slippageBps?: number
  maxSwapCostInCollateralAsset?: MaxSwapCostArg
  quoteDebtToCollateral: QuoteFn
  quoteInputToCollateral?: QuoteFn
  /** Optional overrides for V2 when using VNet/custom deployments */
  routerAddressV2?: Address
  managerAddressV2?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<OrchestrateMintResult> {
  const {
    config,
    account,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    maxSwapCostInCollateralAsset,
    quoteDebtToCollateral,
    quoteInputToCollateral,
  } = params

  if (!quoteDebtToCollateral) throw new Error('quoteDebtToCollateral is required')

  const env =
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string | undefined> }).env) ||
    ((typeof process !== 'undefined' && process.env
      ? (process.env as Record<string, string | undefined>)
      : undefined) ??
      {})
  const envRouterV2 = env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
  // Resolve chain-scoped addresses first (respects Tenderly overrides), then allow explicit overrides
  const chainAddresses = getContractAddresses(params.chainId)
  const routerAddressV2 =
    params.routerAddressV2 ||
    (chainAddresses.leverageRouterV2 as Address | undefined) ||
    envRouterV2

  const plan = await planMintV2({
    config,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral,
    ...(quoteInputToCollateral ? { quoteInputToCollateral } : {}),
    chainId: params.chainId,
  })

  const tx = await executeMintV2({
    config,
    token,
    account,
    plan: {
      inputAsset: plan.inputAsset,
      equityInInputAsset: plan.equityInInputAsset,
      minShares: plan.minShares,
      calls: plan.calls,
      expectedTotalCollateral: plan.expectedTotalCollateral,
      expectedDebt: plan.expectedDebt,
    },
    // Router must exist on the same chain as the token
    routerAddress:
      routerAddressV2 ||
      (contractAddresses[params.chainId]?.leverageRouterV2 as Address | undefined) ||
      (() => {
        throw new Error(`LeverageRouterV2 address required on chain ${params.chainId}`)
      })(),
    multicallExecutor:
      (getContractAddresses(params.chainId).multicallExecutor as Address | undefined) ||
      (typeof import.meta !== 'undefined'
        ? ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.[
            'VITE_MULTICALL_EXECUTOR_ADDRESS'
          ] as Address | undefined)
        : undefined) ||
      (typeof process !== 'undefined'
        ? (process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] as Address | undefined)
        : undefined) ||
      ((): Address => {
        throw new Error(`Multicall executor address required on chain ${params.chainId}`)
      })(),
    ...(typeof maxSwapCostInCollateralAsset !== 'undefined'
      ? { maxSwapCostInCollateralAsset }
      : {}),
    chainId: params.chainId,
  })
  return { plan, ...tx }
}
