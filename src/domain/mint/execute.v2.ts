/**
 * Executes a Leverage Token mint via the V2 router using `mintWithCalls`, powered by Wagmi actions.
 *
 * Invariants/behavior:
 * - Sends a single transaction with planned calls (optional input->collateral conversion and debt->collateral swap).
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Contract addresses and active chain are inferred from the Wagmi config; no chainId parameter.
 */

import type { Address } from 'viem'
import type { Config } from 'wagmi'
import {
  simulateLeverageRouterV2MintWithCalls,
  writeLeverageRouterV2MintWithCalls,
} from '@/lib/contracts/generated'

// Infer call array type directly from generated action signature
type MintWithCallsParams = Parameters<typeof simulateLeverageRouterV2MintWithCalls>[1]
type V2Calls = MintWithCallsParams['args'][4]

import { BPS_DENOMINATOR, DEFAULT_MAX_SWAP_COST_BPS } from './constants'

/**
 * @param config Wagmi Config used to resolve active chain and contract addresses
 * @param token Leverage Token address to mint
 * @param account User address performing the mint
 * @param plan Planned parameters for V2 mint, including encoded calls
 * @param maxSwapCostInCollateralAsset Optional cap for router swap costs
 */
export async function executeMintV2(params: {
  config: Config
  token: Address
  account: Address
  plan: {
    inputAsset: Address
    equityInInputAsset: bigint
    minShares: bigint
    calls: V2Calls
    expectedTotalCollateral: bigint
  }
  maxSwapCostInCollateralAsset?: bigint
}) {
  const { config, token, account, plan, maxSwapCostInCollateralAsset } = params

  // No allowance handling here; UI should perform approvals beforehand

  // Default to sizing swap cost cap from total collateral (collateral units)
  const maxSwapCost =
    maxSwapCostInCollateralAsset ??
    (plan.expectedTotalCollateral * DEFAULT_MAX_SWAP_COST_BPS) / BPS_DENOMINATOR

  const { request } = await simulateLeverageRouterV2MintWithCalls(config, {
    args: [token, plan.equityInInputAsset, plan.minShares, maxSwapCost, plan.calls],
    account,
  })

  const hash = await writeLeverageRouterV2MintWithCalls(config, {
    ...request,
  })
  // Do not wait here — UI should use useWaitForTransactionReceipt on the hash
  return { hash }
}
