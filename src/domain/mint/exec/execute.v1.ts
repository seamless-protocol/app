/**
 * Executes a Leverage Token mint via the V1 router (collateral-only), using Wagmi actions.
 *
 * Invariants/behavior:
 * - inputAsset must equal the token's collateralAsset (or throws).
 * - Calls LeverageRouter.mint(token, equityInCollateralAsset, minShares, maxSwapCost, swapContext).
 * - Derives swapContext from the active chain in the Wagmi config, with a Base/weETH special-case.
 * - Does NOT perform ERC-20 approvals or wait for approvals — the UI is responsible for the Approve step.
 * - Contract addresses and active chain are inferred from the Wagmi config; no chainId parameter.
 */

import { getPublicClient } from '@wagmi/core'
import { type Address, getAddress, type Hash } from 'viem'
import { base } from 'viem/chains'
import type { Config } from 'wagmi'
import { applySlippageFloor } from '@/domain/mint/planner/math'
import {
  BPS_DENOMINATOR,
  DEFAULT_MAX_SWAP_COST_BPS,
  DEFAULT_SLIPPAGE_BPS,
} from '@/domain/mint/utils/constants'
import {
  BASE_TOKEN_ADDRESSES,
  createSwapContext,
  createWeETHSwapContext,
} from '@/domain/mint/utils/swapContext'
import {
  readLeverageManagerGetLeverageTokenCollateralAsset,
  readLeverageManagerGetLeverageTokenDebtAsset,
  readLeverageManagerPreviewMint,
  simulateLeverageRouterMint,
  writeLeverageRouterMint,
} from '@/lib/contracts/generated'

/**
 * @param config Wagmi Config used to resolve active chain and contract addresses
 * @param account User address performing the mint
 * @param token Leverage Token address to mint
 * @param inputAsset Must equal the token's collateral asset (V1 requirement)
 * @param equityInCollateralAsset Equity amount denominated in collateral asset
 * @param slippageBps Optional slippage in BPS for minShares (default 50)
 * @param maxSwapCostInCollateralAsset Optional cap for router swap costs
 */
// Reuse generated Wagmi action types for stronger inference
type Gen = typeof import('@/lib/contracts/generated')
type AccountArg = Extract<Parameters<Gen['writeLeverageRouterMint']>[1]['account'], `0x${string}`>
type TokenArg = Parameters<Gen['readLeverageManagerPreviewMint']>[1]['args'][0]
type EquityInCollateralAssetArg = Parameters<Gen['writeLeverageRouterMint']>[1]['args'][1]
type MaxSwapCostArg = Parameters<Gen['writeLeverageRouterMint']>[1]['args'][3]
type Preview = Awaited<ReturnType<typeof readLeverageManagerPreviewMint>>

export async function executeMintV1(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  inputAsset: Address // must equal collateralAsset
  equityInCollateralAsset: EquityInCollateralAssetArg
  slippageBps?: number
  maxSwapCostInCollateralAsset?: MaxSwapCostArg
}): Promise<{ hash: Hash; preview: Preview }> {
  const { config, account, token, inputAsset, equityInCollateralAsset } = params
  const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS

  const collateralAsset = await fetchCollateralAsset(config, token)
  assertInputIsCollateral(inputAsset, collateralAsset)

  const preview = await fetchPreview(config, token, equityInCollateralAsset)
  const minShares = applySlippageFloor(preview.shares, slippageBps)
  const maxSwapCost = computeMaxSwapCost(
    equityInCollateralAsset,
    params.maxSwapCostInCollateralAsset,
  )

  const debtAsset = await fetchDebtAsset(config, token)
  const activeChainId = getActiveChainId(config)
  const swapContext = buildSwapContext(collateralAsset, debtAsset, activeChainId)

  const hash = await simulateAndSendMint({
    config,
    account,
    token,
    equityInCollateralAsset,
    minShares,
    maxSwapCost,
    swapContext,
  })

  return { hash, preview }
}

//
// Helpers (function declarations for hoisting and clear top-down flow)
//
function getActiveChainId(config: Config): number | undefined {
  const pc = getPublicClient(config)
  return pc?.chain?.id
}

function computeMaxSwapCost(
  equityInCollateralAsset: bigint,
  maxSwapCostInCollateralAsset?: bigint,
): bigint {
  return (
    maxSwapCostInCollateralAsset ??
    (equityInCollateralAsset * DEFAULT_MAX_SWAP_COST_BPS) / BPS_DENOMINATOR
  )
}

async function fetchCollateralAsset(config: Config, token: Address): Promise<Address> {
  return readLeverageManagerGetLeverageTokenCollateralAsset(config, { args: [token] })
}

async function fetchDebtAsset(config: Config, token: Address): Promise<Address> {
  return readLeverageManagerGetLeverageTokenDebtAsset(config, { args: [token] })
}

async function fetchPreview(
  config: Config,
  token: Address,
  equityInCollateralAsset: bigint,
): Promise<Preview> {
  return readLeverageManagerPreviewMint(config, { args: [token, equityInCollateralAsset] })
}

function assertInputIsCollateral(inputAsset: Address, collateralAsset: Address): void {
  if (getAddress(inputAsset) !== getAddress(collateralAsset)) {
    throw new Error('Router v1 only supports depositing the collateral asset directly.')
  }
}

async function simulateAndSendMint(args: {
  config: Config
  account: AccountArg
  token: TokenArg
  equityInCollateralAsset: EquityInCollateralAssetArg
  minShares: bigint
  maxSwapCost: bigint
  swapContext: ReturnType<typeof createSwapContext> | ReturnType<typeof createWeETHSwapContext>
}): Promise<Hash> {
  const { config, account, token, equityInCollateralAsset, minShares, maxSwapCost, swapContext } =
    args
  const { request } = await simulateLeverageRouterMint(config, {
    args: [token, equityInCollateralAsset, minShares, maxSwapCost, swapContext],
    account,
  })
  return writeLeverageRouterMint(config, { ...request })
}

function buildSwapContext(collateralAsset: Address, debtAsset: Address, activeChainId?: number) {
  const isBaseChain = activeChainId === base.id
  const isWeETHCollateral = getAddress(collateralAsset) === getAddress(BASE_TOKEN_ADDRESSES.weETH)
  return isBaseChain && isWeETHCollateral
    ? createWeETHSwapContext()
    : createSwapContext(collateralAsset, debtAsset, activeChainId ?? 0)
}
