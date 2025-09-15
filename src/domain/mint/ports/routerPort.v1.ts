import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
// Infer SwapContext type from generated ABI via helper (keeps types consistent)
import type { SwapContext as V1SwapContext } from '@/domain/mint/swapContext'
import {
  readLeverageManagerPreviewMint,
  simulateLeverageRouterMint,
  writeLeverageRouterMint,
} from '@/lib/contracts/generated'

export interface RouterPortV1PreviewResult {
  collateral: bigint
  debt: bigint
  shares: bigint
}

export interface RouterPortV1 {
  mode: 'v1'
  supportsUserConversion: false
  previewDeposit(args: {
    token: Address
    equityInCollateralAsset: bigint
  }): Promise<RouterPortV1PreviewResult>
  invokeMint(args: {
    token: Address
    equityInCollateralAsset: bigint
    minShares: bigint
    maxSwapCost: bigint
    swapContext: V1SwapContext
    account: Address
  }): Promise<{ hash: Hash }>
}

export function createRouterPortV1(params: { config: Config }): RouterPortV1 {
  const { config } = params
  return {
    mode: 'v1',
    supportsUserConversion: false as const,
    async previewDeposit({ token, equityInCollateralAsset }) {
      const res = await readLeverageManagerPreviewMint(config, {
        args: [token, equityInCollateralAsset],
      })
      return { collateral: res.collateral, debt: res.debt, shares: res.shares }
    },
    async invokeMint({
      token,
      equityInCollateralAsset,
      minShares,
      maxSwapCost,
      swapContext,
      account,
    }) {
      const { request } = await simulateLeverageRouterMint(config, {
        args: [token, equityInCollateralAsset, minShares, maxSwapCost, swapContext],
        account,
      })
      const hash = await writeLeverageRouterMint(config, { ...request })
      return { hash }
    },
  }
}
