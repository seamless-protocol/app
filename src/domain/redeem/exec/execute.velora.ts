/**
 * Executes a Leverage Token redeem using `redeemWithVelora`, powered by Wagmi actions.
 *
 * This function uses seamless's special redeem function that takes Velora-specific parameters
 * including the veloraAdapter address, augustus address, offsets, and swapData.
 *
 * Invariants/behavior:
 * - Sends a single transaction to redeem leverage tokens for collateral using Velora
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Accepts explicit chainId to support cross-chain scenarios (e.g., user on Base viewing Mainnet leverage token)
 *   This allows Wagmi to simulate the transaction properly using the correct chain.
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2RedeemWithVelora,
  writeLeverageRouterV2RedeemWithVelora,
} from '@/lib/contracts/generated'

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
  chainId: SupportedChainId
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

  const { request } = await simulateLeverageRouterV2RedeemWithVelora(config, {
    args: [
      token,
      sharesToRedeem,
      minCollateralForSender,
      veloraAdapter,
      augustus,
      offsets,
      swapData,
    ],
    account,
    chainId,
  })

  const hash = await writeLeverageRouterV2RedeemWithVelora(config, request)
  return { hash }
}
