/**
 * Orchestrator for leverage token minting using router v2.
 *
 * Responsibilities:
 * - Plan V2 flow (optional input->collateral conversion + debt swap) and execute
 * - Return transaction details
 */

import type { Address, Hash } from 'viem'
import { base } from 'viem/chains'
import type { Config } from 'wagmi'
import { contractAddresses } from '@/lib/contracts/addresses'
import { executeMintV2 } from './exec/execute.v2'
import { planMintV2 } from './planner/plan.v2'
import type { QuoteFn } from './planner/types'
import { createManagerPortV2 } from './ports'
import { DEFAULT_SLIPPAGE_BPS } from './utils/constants'

// Keep parameter types simple to avoid brittle codegen coupling
type TokenArg = Address
type AccountArg = Address
type EquityInInputAssetArg = bigint
type MaxSwapCostArg = bigint

// Result type for orchestrated mints
export type OrchestrateMintResult = {
  hash: Hash
  plan: Awaited<ReturnType<typeof planMintV2>>
}

/**
 * Orchestrates a leverage-token mint using router v2.
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
  /** Optional overrides for VNet/custom deployments */
  routerAddressV2?: Address
  managerAddressV2?: Address
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

  if (!quoteDebtToCollateral) {
    throw new Error('quoteDebtToCollateral is required for router v2')
  }

  const envRouterV2 = import.meta.env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
  const envManagerV2 = import.meta.env['VITE_MANAGER_V2_ADDRESS'] as Address | undefined
  const routerAddressV2 = params.routerAddressV2 || envRouterV2
  const managerAddressV2 = params.managerAddressV2 || envManagerV2

  const managerPort = createManagerPortV2({
    config,
    ...(managerAddressV2 ? { managerAddress: managerAddressV2 } : {}),
    ...(routerAddressV2 ? { routerAddress: routerAddressV2 } : {}),
  })

  const plan = await planMintV2({
    config,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral,
    ...(quoteInputToCollateral ? { quoteInputToCollateral } : {}),
    managerPort,
    ...(managerAddressV2 ? { managerAddress: managerAddressV2 } : {}),
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
    routerAddress:
      routerAddressV2 ||
      (contractAddresses[base.id]?.leverageRouterV2 as Address | undefined) ||
      (() => {
        throw new Error('LeverageRouterV2 address required for router v2 flow')
      })(),
    multicallExecutor:
      (typeof import.meta !== 'undefined'
        ? ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.[
            'VITE_MULTICALL_EXECUTOR_ADDRESS'
          ] as Address | undefined)
        : undefined) ||
      (typeof process !== 'undefined'
        ? (process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] as Address | undefined)
        : undefined) ||
      ((): Address => {
        throw new Error('Multicall executor address required for router v2 flow')
      })(),
    ...(typeof maxSwapCostInCollateralAsset !== 'undefined'
      ? { maxSwapCostInCollateralAsset }
      : {}),
  })

  return { hash: tx.hash, plan }
}
