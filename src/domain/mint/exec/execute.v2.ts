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

// Infer call array type from write signature to avoid runtime simulate dependency in tests
type DepositParams = Parameters<typeof writeLeverageRouterV2Deposit>[1]
type V2Calls = DepositParams['args'][5]

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
    routerAddress: _routerAddress,
    multicallExecutor,
    chainId,
  } = params

  // No allowance handling here; UI should perform approvals beforehand

  const { request } = await simulateLeverageRouterV2Deposit(config, {
    args: [
      token,
      plan.equityInInputAsset,
      plan.flashLoanAmount ?? plan.expectedDebt,
      plan.minShares,
      multicallExecutor,
      plan.calls,
    ],
    account,
    chainId: chainId as SupportedChainId,
  })

  const hash = await writeLeverageRouterV2Deposit(config, request)
  return { hash }
}
