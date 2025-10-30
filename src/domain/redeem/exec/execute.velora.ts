/**
 * Executes a Leverage Token redeem using `redeemWithVelora`, powered by Wagmi actions.
 *
 * This function uses seamless's special redeem function that takes Velora-specific parameters
 * including the veloraAdapter address, augustus address, offsets, and swapData.
 *
 * Invariants/behavior:
 * - Sends a single transaction to redeem leverage tokens for collateral using Velora
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Contract addresses and active chain are inferred from the Wagmi config; no chainId parameter.
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2RedeemWithVelora,
  writeLeverageRouterV2RedeemWithVelora,
} from '@/lib/contracts/generated'

// Infer call array type directly from generated action signature
type RedeemWithVeloraParams = Parameters<typeof simulateLeverageRouterV2RedeemWithVelora>[1]

/**
 * @param config Wagmi Config used to resolve active chain and contract addresses
 * @param token Leverage Token address to redeem
 * @param account User address performing the redeem
 * @param sharesToRedeem Number of leverage token shares to redeem
 * @param minCollateralForSender Minimum collateral amount expected (with slippage protection)
 * @param veloraAdapter Velora adapter contract address
 * @param augustus ParaSwap Augustus contract address
 * @param offsets Velora offsets struct with exactAmount, limitAmount, quotedAmount
 * @param swapData Velora swap calldata from quote
 * @param routerAddress Explicit LeverageRouterV2 address (required for VNet/custom deployments)
 * @param chainId Chain ID to execute the transaction on
 */
export async function executeRedeemWithVelora(params: {
  config: Config
  token: Address
  account: Address
  sharesToRedeem: bigint
  minCollateralForSender: bigint
  veloraAdapter: Address
  augustus: Address
  offsets: {
    exactAmount: bigint
    limitAmount: bigint
    quotedAmount: bigint
  }
  swapData: `0x${string}`
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
    veloraAdapter,
    augustus,
    offsets,
    swapData,
    routerAddress: _routerAddress,
    chainId,
  } = params

  // No allowance handling here; UI should perform approvals beforehand

  const args = [
    token,
    sharesToRedeem,
    minCollateralForSender,
    veloraAdapter,
    augustus,
    offsets,
    swapData,
  ] satisfies RedeemWithVeloraParams['args']

  const skipSimulate =
    (typeof process !== 'undefined' && process.env['TEST_SKIP_SIMULATE'] === '1') || false

  const chain = chainId as SupportedChainId

  if (skipSimulate) {
    const hash = await writeLeverageRouterV2RedeemWithVelora(config, {
      account,
      args,
      chainId: chain,
    })
    return { hash }
  }

  const { request } = await simulateLeverageRouterV2RedeemWithVelora(config, {
    // redeemWithVelora(token, shares, minCollateralForSender, veloraAdapter, augustus, offsets, swapData)
    args,
    account,
    chainId: chain,
  })

  const hash = await writeLeverageRouterV2RedeemWithVelora(config, {
    args: request.args,
    account,
    ...(request.value ? { value: request.value } : {}),
    chainId: chain,
  })
  return { hash }
}
