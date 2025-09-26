/**
 * Orchestrator for leverage token minting across router versions.
 *
 * Responsibilities:
 * - Detect router version (env override or runtime probe)
 * - Plan V2 flow (optional input->collateral conversion + debt swap) and execute
 * - Enforce V1 invariant (collateral-only input) and execute
 * - Return a discriminated result including version and tx details
 */

// import { getPublicClient } from '@wagmi/core'
import type { Address, Hash } from 'viem'
import { base } from 'viem/chains'
import type { Config } from 'wagmi'
import { contractAddresses } from '@/lib/contracts/addresses'
import { executeMintV1 } from './exec/execute.v1'
import { executeMintV2 } from './exec/execute.v2'
import { planMintV2 } from './planner/plan.v2'
import { type QuoteFn, RouterVersion } from './planner/types'
import { createManagerPortV2 } from './ports'
import { DEFAULT_SLIPPAGE_BPS } from './utils/constants'
// Addresses inferred by actions from config
import { detectRouterVersion } from './utils/detectVersion'

// Keep parameter types simple to avoid brittle codegen coupling
type TokenArg = Address
type AccountArg = Address
type EquityInInputAssetArg = bigint
type MaxSwapCostArg = bigint

// Discriminated result type for orchestrated mints
export type OrchestrateMintResult =
  | {
      routerVersion: 'v1'
      hash: Hash
      preview: { shares: bigint; tokenFee: bigint; treasuryFee: bigint }
    }
  | {
      routerVersion: 'v2'
      hash: Hash
      plan: ReturnType<typeof planMintV2> extends Promise<infer P> ? P : never
    }

/**
 * Orchestrates a leverage-token mint by selecting the appropriate router flow (V1 or V2).
 *
 * Behavior
 * - Detects the router version at runtime (with optional env override inside `detectRouterVersion`).
 * - V2: Plans the mint (optionally converting input->collateral, and swapping debt->collateral), then executes.
 * - V1: Enforces collateral-only input and executes a simple mint path.
 *
 * Requirements
 * - Router V2 requires a `quoteDebtToCollateral` function. If the input asset differs from the collateral asset,
 *   provide `quoteInputToCollateral` as well to enable the input->collateral conversion step in the plan.
 * - Router V1 ignores quote functions and will fail if `inputAsset` is not the collateral asset.
 *
 * Parameters
 * @param params.config Wagmi `Config` used by generated actions for chain/account wiring.
 * @param params.account EOA that signs and submits transactions (hex address string).
 * @param params.token Leverage token tuple argument as required by generated actions.
 * @param params.inputAsset Address of the asset used as input for the mint (may equal collateral asset).
 * @param params.equityInInputAsset Equity amount expressed in the `inputAsset` units.
 * @param params.slippageBps Optional slippage tolerance in basis points (default 50 = 0.50%).
 * @param params.maxSwapCostInCollateralAsset Optional max swap cost, denominated in the collateral asset, forwarded to the router.
 * @param params.quoteDebtToCollateral Required for V2. Quotes amount of collateral received for a given debt amount.
 * @param params.quoteInputToCollateral Optional for V2. Quotes amount of collateral received for a given input asset amount when input != collateral.
 *
 * Returns
 * - Discriminated union by `routerVersion`:
 *   - `v1`: `{ routerVersion: 'v1', hash, preview }`
 *   - `v2`: `{ routerVersion: 'v2', hash, plan }`
 *
 * Throws
 * - If router V2 is selected and `quoteDebtToCollateral` is not provided.
 * - If V1 invariants are violated by downstream execution (e.g., non-collateral input).
 *
 * Example usage
 * - Returns `{ routerVersion: 'v1' | 'v2', hash, ... }` depending on runtime detection.
 */
export async function orchestrateMint(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  inputAsset: Address
  equityInInputAsset: EquityInInputAssetArg
  slippageBps?: number
  maxSwapCostInCollateralAsset?: MaxSwapCostArg
  quoteDebtToCollateral?: QuoteFn
  quoteInputToCollateral?: QuoteFn
  /** Optional overrides for V2 when using VNet/custom deployments */
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

  const version = detectRouterVersion()

  if (version === RouterVersion.V2) {
    if (!quoteDebtToCollateral) throw new Error('quoteDebtToCollateral is required for router v2')
    const env =
      (typeof import.meta !== 'undefined' &&
        (import.meta as unknown as { env?: Record<string, string | undefined> }).env) ||
      ((typeof process !== 'undefined' && process.env
        ? (process.env as Record<string, string | undefined>)
        : undefined) ??
        {})
    const envRouterV2 = env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
    const envManagerV2 = env['VITE_MANAGER_V2_ADDRESS'] as Address | undefined
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
    return { routerVersion: 'v2' as const, plan, ...tx }
  }

  // V1 path (manager port available if needed later)
  const tx = await executeMintV1({
    config,
    account,
    token,
    inputAsset,
    equityInCollateralAsset: equityInInputAsset,
    slippageBps,
    ...(typeof maxSwapCostInCollateralAsset !== 'undefined'
      ? { maxSwapCostInCollateralAsset }
      : {}),
  })
  return { routerVersion: 'v1' as const, ...tx }
}
