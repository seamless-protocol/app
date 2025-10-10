/**
 * Executes a Leverage Token mint using `mintWithCalls`, powered by Wagmi actions.
 *
 * Invariants/behavior:
 * - Sends a single transaction with planned calls (debt->collateral swap only; no input conversion in initial scope).
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Contract addresses and active chain are inferred from the Wagmi config; no chainId parameter.
 */

import type { Address } from 'viem'
import type { Config } from 'wagmi'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'

// Infer call array type directly from generated action signature
type DepositParams = Parameters<typeof simulateLeverageRouterV2Deposit>[1]
type V2Calls = DepositParams['args'][5]

import { BPS_DENOMINATOR, DEFAULT_MAX_SWAP_COST_BPS } from '@/domain/mint/utils/constants'

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
    flashLoanAmount?: bigint
    minShares: bigint
    calls: V2Calls
    expectedTotalCollateral: bigint
    expectedDebt: bigint
  }
  maxSwapCostInCollateralAsset?: bigint
  /** Explicit LeverageRouterV2 address (required for VNet/custom deployments) */
  routerAddress: Address
  /** Multicall executor address (required for audit-fixes ABI) */
  multicallExecutor: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}) {
  const {
    config,
    token,
    account,
    plan,
    maxSwapCostInCollateralAsset,
    routerAddress: _routerAddress,
    multicallExecutor,
    chainId,
  } = params

  // No allowance handling here; UI should perform approvals beforehand

  void (
    maxSwapCostInCollateralAsset ??
    (plan.expectedTotalCollateral * DEFAULT_MAX_SWAP_COST_BPS) / BPS_DENOMINATOR
  )

  const args = [
    token,
    plan.equityInInputAsset,
    (plan.flashLoanAmount ?? plan.expectedDebt),
    plan.minShares,
    multicallExecutor,
    plan.calls,
  ] satisfies DepositParams['args']

  const chain = chainId as SupportedChainId
  /*
   * NOTE: Simulation commented out intentionally to surface revert reasons
   * directly in Tenderly when writing the transaction.
   *
   * const { request } = await simulateLeverageRouterV2Deposit(config, {
   *   args,
   *   account,
   *   chainId: chain,
   * })
   *
   * const hash = await writeLeverageRouterV2Deposit(config, {
   *   args: request.args,
   *   account,
   *   ...(request.value ? { value: request.value } : {}),
   *   chainId: chain,
   * })
   * return { hash }
   */

  // Direct write path (no simulate). Useful for Tenderly debugging to see revert details.
  const hash = await writeLeverageRouterV2Deposit(config, {
    args,
    account,
    chainId: chain,
  })
  return { hash }
}
