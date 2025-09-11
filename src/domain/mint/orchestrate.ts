/**
 * Orchestrator for leverage token minting across router versions.
 *
 * Responsibilities:
 * - Detect router version (env override or runtime probe)
 * - Plan V2 flow (optional input->collateral conversion + debt swap) and execute
 * - Enforce V1 invariant (collateral-only input) and execute
 * - Return a discriminated result including version and tx details
 */
import type { Address } from 'viem'
import { detectRouterVersion } from './detectVersion'
import { executeMintV1 } from './execute.v1'
import { executeMintV2 } from './execute.v2'
import { planMintV2 } from './plan.v2'
import {
  type Addresses,
  type Clients,
  type IoOverrides,
  type QuoteFn,
  RouterVersion,
} from './types'

/**
 * Orchestrates a mint by selecting V1 or V2 execution path.
 *
 * Notes:
 * - V2 requires quote functions for debt->collateral (and optionally input->collateral).
 * - V1 ignores quote functions and throws if input asset != collateral asset.
 */
export async function orchestrateMint(params: {
  clients: Clients
  addresses: Addresses
  account: Address
  inputAsset: Address
  equityInInputAsset: bigint
  slippageBps?: number
  maxSwapCostInCollateralAsset?: bigint
  quoteDebtToCollateral?: QuoteFn
  quoteInputToCollateral?: QuoteFn
  io?: IoOverrides
}) {
  const {
    clients,
    addresses,
    account,
    inputAsset,
    equityInInputAsset,
    slippageBps = 50,
    maxSwapCostInCollateralAsset,
    quoteDebtToCollateral,
    quoteInputToCollateral,
    io,
  } = params

  const version = await detectRouterVersion(clients.publicClient, addresses.router)

  if (version === RouterVersion.V2) {
    if (!quoteDebtToCollateral) throw new Error('quoteDebtToCollateral is required for router v2')
    const plan = await planMintV2({
      publicClient: clients.publicClient,
      router: addresses.router,
      manager: addresses.manager,
      token: addresses.token,
      inputAsset,
      equityInInputAsset,
      slippageBps,
      quoteDebtToCollateral,
      ...(quoteInputToCollateral ? { quoteInputToCollateral } : {}),
    })

    const tx = await executeMintV2(
      clients,
      addresses.router,
      addresses.token,
      account,
      {
        inputAsset: plan.inputAsset,
        equityInInputAsset: plan.equityInInputAsset,
        minShares: plan.minShares,
        calls: plan.calls,
      },
      maxSwapCostInCollateralAsset,
      io,
    )
    return { routerVersion: 'v2' as const, plan, ...tx }
  }

  const v1Params: {
    inputAsset: Address
    equityInCollateralAsset: bigint
    slippageBps?: number
    maxSwapCostInCollateralAsset?: bigint
    io?: IoOverrides
  } = {
    inputAsset,
    equityInCollateralAsset: equityInInputAsset,
    slippageBps,
  }
  if (typeof maxSwapCostInCollateralAsset !== 'undefined') {
    v1Params.maxSwapCostInCollateralAsset = maxSwapCostInCollateralAsset
  }
  if (typeof io !== 'undefined') {
    v1Params.io = io
  }

  const tx = await executeMintV1(clients, addresses, account, v1Params)
  return { routerVersion: 'v1' as const, ...tx }
}
