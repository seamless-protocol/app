import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import {
  readLeverageManagerV2PreviewRedeem,
  simulateLeverageRouterV2Redeem,
  writeLeverageRouterV2Redeem,
} from '@/lib/contracts/generated'

// Infer swap calls tuple type from generated action signature
type RedeemParams = Parameters<typeof simulateLeverageRouterV2Redeem>[1]
type V2Calls = RedeemParams['args'][4]

export interface RouterPortV2PreviewResult {
  collateral: bigint
  debt: bigint
  shares: bigint
}

export interface RouterPortV2 {
  mode: 'v2'
  supportsUserConversion: boolean
  previewRedeem(args: {
    token: Address
    sharesToRedeem: bigint
  }): Promise<RouterPortV2PreviewResult>
  invokeRedeem(args: {
    token: Address
    sharesToRedeem: bigint
    minCollateralForSender: bigint
    multicallExecutor: Address
    calls: V2Calls
    account: Address
  }): Promise<{ hash: Hash }>
}

export function createRouterPortV2(params: {
  config: Config
  routerAddress: Address
}): RouterPortV2 {
  const { config, routerAddress } = params
  return {
    mode: 'v2',
    supportsUserConversion: false,
    async previewRedeem({ token, sharesToRedeem }) {
      const res = await readLeverageManagerV2PreviewRedeem(config, {
        address: routerAddress,
        args: [token, sharesToRedeem],
      })
      return { collateral: res.collateral, debt: res.debt, shares: res.shares }
    },
    async invokeRedeem({
      token,
      sharesToRedeem,
      minCollateralForSender,
      multicallExecutor,
      calls,
      account,
    }) {
      const { request } = await simulateLeverageRouterV2Redeem(config, {
        address: routerAddress,
        args: [token, sharesToRedeem, minCollateralForSender, multicallExecutor, calls],
        account,
      })
      const hash = await writeLeverageRouterV2Redeem(config, { ...request })
      return { hash }
    },
  }
}
