import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import { getPublicClient } from '@wagmi/core'
import { base } from 'viem/chains'
import {
  readLeverageManagerPreviewRedeem,
  readLeverageManagerGetLeverageTokenCollateralAsset,
  readLeverageManagerGetLeverageTokenDebtAsset,
  simulateLeverageRouterRedeem,
  writeLeverageRouterRedeem,
} from '@/lib/contracts/generated'
import { DEFAULT_MAX_REDEEM_SWAP_COST_BPS, BPS_DENOMINATOR } from '../utils/constants'
import {
  BASE_TOKEN_ADDRESSES,
  createSwapContext,
  createWeETHSwapContext,
} from '../../mint/utils/swapContext'

export interface RouterPortV1PreviewResult {
  collateral: bigint
  debt: bigint
  shares: bigint
}

export interface RouterPortV1 {
  mode: 'v1'
  supportsUserConversion: false
  previewRedeem(args: {
    token: Address
    sharesToRedeem: bigint
  }): Promise<RouterPortV1PreviewResult>
  invokeRedeem(args: {
    token: Address
    sharesToRedeem: bigint
    minCollateral: bigint
    account: Address
  }): Promise<{ hash: Hash }>
}

export function createRouterPortV1(params: { config: Config }): RouterPortV1 {
  const { config } = params
  return {
    mode: 'v1',
    supportsUserConversion: false as const,
    async previewRedeem({ token, sharesToRedeem }) {
      const res = await readLeverageManagerPreviewRedeem(config, {
        args: [token, sharesToRedeem],
      })
      return { collateral: res.collateral, debt: res.debt, shares: res.shares }
    },
    async invokeRedeem({ token, sharesToRedeem, minCollateral, account }) {
      // V1 router expects: (token, sharesToRedeem, minCollateralForSender, maxSwapCostInCollateralAsset, swapContext)
      // Get preview to calculate proper values
      const preview = await readLeverageManagerPreviewRedeem(config, {
        args: [token, sharesToRedeem],
      })

      // Use the provided minCollateral parameter
      const minCollateralForSender = minCollateral

      // Calculate max swap cost (2% of collateral)
      const maxSwapCostInCollateralAsset =
        (preview.collateral * DEFAULT_MAX_REDEEM_SWAP_COST_BPS) / BPS_DENOMINATOR

      // Get asset addresses and build swap context
      const collateralAsset = await readLeverageManagerGetLeverageTokenCollateralAsset(config, {
        args: [token],
      })
      const debtAsset = await readLeverageManagerGetLeverageTokenDebtAsset(config, {
        args: [token],
      })

      const publicClient = getPublicClient(config)
      const activeChainId = publicClient?.chain?.id
      const swapContext = buildSwapContext(collateralAsset, debtAsset, activeChainId)

      const { request } = await simulateLeverageRouterRedeem(config, {
        args: [
          token,
          sharesToRedeem,
          minCollateralForSender,
          maxSwapCostInCollateralAsset,
          swapContext,
        ],
        account,
      })
      const hash = await writeLeverageRouterRedeem(config, { ...request })
      return { hash }
    },
  }
}

// Helper function to build swap context (mirrors execute.v1.ts)
function buildSwapContext(collateralAsset: Address, debtAsset: Address, activeChainId?: number) {
  const isBaseChain = activeChainId === base.id
  const isWeETHCollateral = collateralAsset === BASE_TOKEN_ADDRESSES.weETH
  return isBaseChain && isWeETHCollateral
    ? createWeETHSwapContext()
    : createSwapContext(collateralAsset, debtAsset, activeChainId ?? 0)
}
