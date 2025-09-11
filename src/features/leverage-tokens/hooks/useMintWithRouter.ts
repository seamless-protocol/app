/**
 * React Query hook wrapping the domain-level orchestrateMint.
 *
 * Return type is discriminated by `routerVersion`:
 * - v1: { routerVersion: 'v1', hash, receipt, preview }
 * - v2: { routerVersion: 'v2', hash, receipt, plan }
 *
 * Optional params:
 * - `slippageBps`, `maxSwapCostInCollateralAsset` tune mint behavior
 * - V2 requires `quoteDebtToCollateral` and optionally `quoteInputToCollateral` if input != collateral
 */
import { useMutation } from '@tanstack/react-query'
import type { Address, Hash } from 'viem'
import {
  type Addresses,
  type Clients,
  type IoOverrides,
  type MintPlanV2,
  orchestrateMint,
  type PreviewMintResult,
  type QuoteFn,
} from '@/domain/mint'

export type OrchestrateMintResult =
  | { routerVersion: 'v1'; hash: Hash; receipt: unknown; preview: PreviewMintResult }
  | { routerVersion: 'v2'; hash: Hash; receipt: unknown; plan: MintPlanV2 }

export interface UseMintWithRouterParams {
  clients: Clients
  addresses: Addresses
  account: Address
  inputAsset: Address
  equityInInputAsset: bigint
  slippageBps?: number
  maxSwapCostInCollateralAsset?: bigint
  quoteDebtToCollateral?: QuoteFn
  quoteInputToCollateral?: QuoteFn
  io?: IoOverrides
}

/**
 * Thin hook wrapper around the domain-level mintWithRouter.
 * Note: Not wired into any UI in slice 1. Safe to export for future use.
 */
export function useMintWithRouter() {
  return useMutation<OrchestrateMintResult, Error, UseMintWithRouterParams>({
    mutationFn: async ({
      clients,
      addresses,
      account,
      inputAsset,
      equityInInputAsset,
      slippageBps,
      maxSwapCostInCollateralAsset,
      quoteDebtToCollateral,
      quoteInputToCollateral,
      io,
    }) =>
      (await orchestrateMint({
        clients,
        addresses,
        account,
        inputAsset,
        equityInInputAsset,
        ...(typeof slippageBps !== 'undefined' ? { slippageBps } : {}),
        ...(typeof maxSwapCostInCollateralAsset !== 'undefined'
          ? { maxSwapCostInCollateralAsset }
          : {}),
        ...(typeof quoteDebtToCollateral !== 'undefined' ? { quoteDebtToCollateral } : {}),
        ...(typeof quoteInputToCollateral !== 'undefined' ? { quoteInputToCollateral } : {}),
        ...(typeof io !== 'undefined' ? { io } : {}),
      })) as unknown as OrchestrateMintResult,
  })
}
