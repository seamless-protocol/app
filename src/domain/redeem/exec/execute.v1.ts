/**
 * Executes a Leverage Token redeem via the V1 router, using Wagmi actions.
 *
 * Invariants/behavior:
 * - Calls LeverageRouter.redeem(token, sharesToRedeem, minCollateralForSender).
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Contract addresses and active chain are inferred from the Wagmi config; no chainId parameter.
 */

import { getPublicClient } from '@wagmi/core'
import { type Address, type Hash } from 'viem'
import { base } from 'viem/chains'
import type { Config } from 'wagmi'
import { calculateMinCollateralForSender } from '../utils/slippage'
import {
  BPS_DENOMINATOR,
  DEFAULT_SLIPPAGE_BPS,
  DEFAULT_MAX_REDEEM_SWAP_COST_BPS,
} from '../utils/constants'
import {
  readLeverageManagerPreviewRedeem,
  readLeverageManagerGetLeverageTokenCollateralAsset,
  readLeverageManagerGetLeverageTokenDebtAsset,
  simulateLeverageRouterRedeem,
  writeLeverageRouterRedeem,
} from '@/lib/contracts/generated'
import {
  BASE_TOKEN_ADDRESSES,
  createSwapContext,
  createWeETHSwapContext,
} from '../../mint/utils/swapContext'

// Reuse generated Wagmi action types for stronger inference
type Gen = typeof import('@/lib/contracts/generated')
type AccountArg = Extract<Parameters<Gen['writeLeverageRouterRedeem']>[1]['account'], `0x${string}`>
type TokenArg = Parameters<Gen['readLeverageManagerPreviewRedeem']>[1]['args'][0]
type SharesToRedeemArg = Parameters<Gen['writeLeverageRouterRedeem']>[1]['args'][1]
type Preview = Awaited<ReturnType<typeof readLeverageManagerPreviewRedeem>>

export async function executeRedeemV1(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps?: number
}): Promise<{ hash: Hash; preview: Preview }> {
  const { config, account, token, sharesToRedeem } = params
  const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS

  const preview = await fetchPreview(config, token, sharesToRedeem)
  const minCollateralForSender = calculateMinCollateralForSender(preview.collateral, slippageBps)
  const maxSwapCost = (preview.collateral * DEFAULT_MAX_REDEEM_SWAP_COST_BPS) / BPS_DENOMINATOR

  const collateralAsset = await fetchCollateralAsset(config, token)
  const debtAsset = await fetchDebtAsset(config, token)
  const activeChainId = getActiveChainId(config)
  const swapContext = buildSwapContext(collateralAsset, debtAsset, activeChainId)

  const hash = await simulateAndSendRedeem({
    config,
    account,
    token,
    sharesToRedeem,
    minCollateralForSender,
    maxSwapCost,
    swapContext,
  })

  return { hash, preview }
}

//
// Helpers (function declarations for hoisting and clear top-down flow)
//

async function fetchPreview(
  config: Config,
  token: Address,
  sharesToRedeem: bigint,
): Promise<Preview> {
  return readLeverageManagerPreviewRedeem(config, { args: [token, sharesToRedeem] })
}

function getActiveChainId(config: Config): number | undefined {
  const pc = getPublicClient(config)
  return pc?.chain?.id
}

async function fetchCollateralAsset(config: Config, token: Address): Promise<Address> {
  return readLeverageManagerGetLeverageTokenCollateralAsset(config, { args: [token] })
}

async function fetchDebtAsset(config: Config, token: Address): Promise<Address> {
  return readLeverageManagerGetLeverageTokenDebtAsset(config, { args: [token] })
}

function buildSwapContext(collateralAsset: Address, debtAsset: Address, activeChainId?: number) {
  const isBaseChain = activeChainId === base.id
  const isWeETHCollateral = collateralAsset === BASE_TOKEN_ADDRESSES.weETH
  return isBaseChain && isWeETHCollateral
    ? createWeETHSwapContext()
    : createSwapContext(collateralAsset, debtAsset, activeChainId ?? 0)
}

async function simulateAndSendRedeem(args: {
  config: Config
  account: AccountArg
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  minCollateralForSender: bigint
  maxSwapCost: bigint
  swapContext: ReturnType<typeof createSwapContext> | ReturnType<typeof createWeETHSwapContext>
}): Promise<Hash> {
  const {
    config,
    account,
    token,
    sharesToRedeem,
    minCollateralForSender,
    maxSwapCost,
    swapContext,
  } = args
  const { request } = await simulateLeverageRouterRedeem(config, {
    args: [token, sharesToRedeem, minCollateralForSender, maxSwapCost, swapContext],
    account,
  })
  return writeLeverageRouterRedeem(config, { ...request })
}
