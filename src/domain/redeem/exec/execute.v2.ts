/**
 * Executes a Leverage Token redeem via the V2 router using `redeem`, powered by Wagmi actions.
 *
 * Invariants/behavior:
 * - Sends a single transaction to redeem leverage tokens for collateral
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Contract addresses and active chain are inferred from the Wagmi config; no chainId parameter.
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import {
  simulateLeverageRouterV2Redeem,
  writeLeverageRouterV2Redeem,
} from '@/lib/contracts/generated'

// Infer call array type directly from generated action signature
type RedeemParams = Parameters<typeof simulateLeverageRouterV2Redeem>[1]
type V2Calls = RedeemParams['args'][4]

/**
 * @param config Wagmi Config used to resolve active chain and contract addresses
 * @param token Leverage Token address to redeem
 * @param account User address performing the redeem
 * @param sharesToRedeem Number of leverage token shares to redeem
 * @param minCollateralForSender Minimum collateral amount expected (with slippage protection)
 * @param multicallExecutor Multicall executor address for V2 calls
 * @param swapCalls Array of calls for any necessary swaps during redemption
 * @param routerAddress Explicit LeverageRouterV2 address (required for VNet/custom deployments)
 * @param chainId Chain ID to execute the transaction on
 */
export async function executeRedeemV2(params: {
  config: Config
  token: Address
  account: Address
  sharesToRedeem: bigint
  minCollateralForSender: bigint
  multicallExecutor: Address
  swapCalls: V2Calls
  /** Explicit LeverageRouterV2 address (required for VNet/custom deployments) */
  routerAddress: Address
  chainId: number
}): Promise<{ hash: Hash }> {
  const {
    config,
    token,
    account,
    sharesToRedeem,
    minCollateralForSender,
    multicallExecutor,
    swapCalls,
    routerAddress,
    chainId,
  } = params

  // No allowance handling here; UI should perform approvals beforehand

  const args = [
    token,
    sharesToRedeem,
    minCollateralForSender,
    multicallExecutor,
    swapCalls,
  ] satisfies RedeemParams['args']

  const skipSimulate =
    (typeof process !== 'undefined' && process.env['TEST_SKIP_SIMULATE'] === '1') || false

  if (skipSimulate) {
    const hash = await writeLeverageRouterV2Redeem(config, {
      address: routerAddress,
      account,
      args,
      chainId,
    })
    return { hash }
  }

  const { request } = await simulateLeverageRouterV2Redeem(config, {
    address: routerAddress,
    // redeem(token, shares, minCollateralForSender, multicallExecutor, swapCalls)
    args,
    account,
    chainId,
  })

  const hash = await writeLeverageRouterV2Redeem(config, { ...request })
  return { hash }
}
