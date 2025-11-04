/**
 * Executes a Leverage Token redeem using `redeem`, powered by Wagmi actions.
 *
 * Invariants/behavior:
 * - Sends a single transaction to redeem leverage tokens for collateral
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Accepts explicit chainId to support cross-chain scenarios (e.g., user on Base viewing Mainnet leverage token)
 *   This allows Wagmi to simulate the transaction properly using the correct chain.
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2Redeem,
  writeLeverageRouterV2Redeem,
} from '@/lib/contracts/generated'

// Infer call array type directly from generated action signature
type RedeemParams = Parameters<typeof simulateLeverageRouterV2Redeem>[1]
type Calls = RedeemParams['args'][4]

/**
 * @param config Wagmi Config used to resolve active chain and contract addresses
 * @param token Leverage Token address to redeem
 * @param account User address performing the redeem
 * @param sharesToRedeem Number of leverage token shares to redeem
 * @param minCollateralForSender Minimum collateral amount expected (with slippage protection)
 * @param multicallExecutor Multicall executor address for calls
 * @param swapCalls Array of calls for any necessary swaps during redemption
 * @param routerAddress Explicit LeverageRouterV2 address (required for VNet/custom deployments)
 * @param chainId Chain ID to execute the transaction on
 */
export async function executeRedeem(params: {
  config: Config
  token: Address
  account: Address
  sharesToRedeem: bigint
  minCollateralForSender: bigint
  multicallExecutor: Address
  swapCalls: Calls
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
    routerAddress: _routerAddress,
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

  const chain = chainId as SupportedChainId

  if (skipSimulate) {
    const hash = await writeLeverageRouterV2Redeem(config, {
      account,
      args,
      chainId: chain,
    })
    return { hash }
  }

  const { request } = await simulateLeverageRouterV2Redeem(config, {
    // redeem(token, shares, minCollateralForSender, multicallExecutor, swapCalls)
    args,
    account,
    chainId: chain,
  })

  const hash = await writeLeverageRouterV2Redeem(config, {
    args: request.args,
    account,
    ...(request.value ? { value: request.value } : {}),
    chainId: chain,
  })
  return { hash }
}
