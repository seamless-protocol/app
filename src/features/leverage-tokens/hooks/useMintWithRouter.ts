/**
 * React Query hook wrapping the domain-level orchestrateMint.
 *
 * Returns { hash, plan } with transaction hash and execution plan.
 *
 * Optional params:
 * - `slippageBps`, `maxSwapCostInCollateralAsset` tune mint behavior
 * - Requires `quoteDebtToCollateral` and optionally `quoteInputToCollateral` if input != collateral
 */
import { useMutation } from '@tanstack/react-query'
import type { Address } from 'viem'
import { useConfig } from 'wagmi'
import { type OrchestrateMintResult, orchestrateMint, type QuoteFn } from '@/domain/mint'

type Gen = typeof import('@/lib/contracts/generated')

type TokenArg = Parameters<Gen['readLeverageManagerPreviewMint']>[1]['args'][0]
type AccountArg = Extract<Parameters<Gen['writeLeverageRouterMint']>[1]['account'], `0x${string}`>
// For v2 deposit, arg[1] is collateralFromSender
type EquityInInputAssetArg = Parameters<Gen['writeLeverageRouterV2Deposit']>[1]['args'][1]
type MaxSwapCostArg = Parameters<Gen['writeLeverageRouterMint']>[1]['args'][3]

export interface UseMintWithRouterParams {
  token: TokenArg
  account: AccountArg
  inputAsset: Address
  equityInInputAsset: EquityInInputAssetArg
  slippageBps?: number
  maxSwapCostInCollateralAsset?: MaxSwapCostArg
  quoteDebtToCollateral: QuoteFn
  quoteInputToCollateral?: QuoteFn
  chainId: number
}

/**
 * Thin hook wrapper around the domain-level mintWithRouter.
 */
export function useMintWithRouter() {
  const config = useConfig()
  return useMutation<OrchestrateMintResult, Error, UseMintWithRouterParams>({
    mutationFn: async ({
      token,
      account,
      inputAsset,
      equityInInputAsset,
      slippageBps,
      maxSwapCostInCollateralAsset,
      quoteDebtToCollateral,
      quoteInputToCollateral,
      chainId,
    }) =>
      orchestrateMint({
        config,
        account,
        token,
        inputAsset,
        equityInInputAsset,
        ...(typeof slippageBps !== 'undefined' ? { slippageBps } : {}),
        ...(typeof maxSwapCostInCollateralAsset !== 'undefined'
          ? { maxSwapCostInCollateralAsset }
          : {}),
        quoteDebtToCollateral,
        ...(typeof quoteInputToCollateral !== 'undefined' ? { quoteInputToCollateral } : {}),
        chainId,
      }),
  })
}
