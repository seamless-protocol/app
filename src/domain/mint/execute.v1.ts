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
import { type Address, getAddress } from 'viem'
import { base } from 'viem/chains'
import type { Config } from 'wagmi'
import {
  readLeverageManagerGetLeverageTokenCollateralAsset,
  readLeverageManagerGetLeverageTokenDebtAsset,
  readLeverageManagerPreviewMint,
  simulateLeverageRouterMint,
  writeLeverageRouterMint,
} from '@/lib/contracts/generated'
import { BPS_DENOMINATOR, DEFAULT_MAX_SWAP_COST_BPS } from './constants'
import { BASE_TOKEN_ADDRESSES, createSwapContext, createWeETHSwapContext } from './swapContext'

/**
 * @param config Wagmi Config used to resolve active chain and contract addresses
 * @param account User address performing the mint
 * @param token Leverage Token address to mint
 * @param inputAsset Must equal the token's collateral asset (V1 requirement)
 * @param equityInCollateralAsset Equity amount denominated in collateral asset
 * @param slippageBps Optional slippage in BPS for minShares (default 50)
 * @param maxSwapCostInCollateralAsset Optional cap for router swap costs
 */
export async function executeMintV1(params: {
  config: Config
  account: Address
  token: Address
  inputAsset: Address // must equal collateralAsset
  equityInCollateralAsset: bigint
  slippageBps?: number
  maxSwapCostInCollateralAsset?: bigint
}) {
  const {
    config,
    account,
    token,
    inputAsset,
    equityInCollateralAsset,
    slippageBps = 50,
    maxSwapCostInCollateralAsset,
  } = params

  const collateralAsset = await readLeverageManagerGetLeverageTokenCollateralAsset(config, {
    args: [token],
  })

  if (getAddress(inputAsset) !== getAddress(collateralAsset)) {
    throw new Error('Router v1 only supports depositing the collateral asset directly.')
  }

  const preview = await readLeverageManagerPreviewMint(config, {
    args: [token, equityInCollateralAsset],
  })
  // Apply slippage tolerance (in BPS) to compute minimum acceptable shares
  const minShares = (preview.shares * (BPS_DENOMINATOR - BigInt(slippageBps))) / BPS_DENOMINATOR
  // Cap router swap costs; default is 5% (500 bps) of input equity unless overridden
  const maxSwapCost =
    maxSwapCostInCollateralAsset ??
    (equityInCollateralAsset * DEFAULT_MAX_SWAP_COST_BPS) / BPS_DENOMINATOR

  const debtAsset = await readLeverageManagerGetLeverageTokenDebtAsset(config, {
    args: [token],
  })

  const pc = getPublicClient(config)
  const activeChainId = pc?.chain?.id

  // Special-case: On Base, when collateral is weETH, route with a curated
  // swap context targeting the best-known liquidity (Aerodrome) for this pair.
  // All other cases use the generic, chain-aware swap context.
  const isBaseChain = activeChainId === base.id
  const isWeETHCollateral = getAddress(collateralAsset) === getAddress(BASE_TOKEN_ADDRESSES.weETH)
  const swapContext =
    isBaseChain && isWeETHCollateral
      ? createWeETHSwapContext()
      : createSwapContext(collateralAsset, debtAsset, activeChainId ?? 0)

  // Approvals should be performed by UI before invoking execute

  const { request } = await simulateLeverageRouterMint(config, {
    args: [token, equityInCollateralAsset, minShares, maxSwapCost, swapContext],
    account,
  })
  const hash = await writeLeverageRouterMint(config, { ...request })

  // Do not wait here — UI should use useWaitForTransactionReceipt on the hash
  return { hash, preview }
}
