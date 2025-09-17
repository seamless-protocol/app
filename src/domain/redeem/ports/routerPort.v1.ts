import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import {
  readLeverageManagerPreviewRedeem,
  simulateLeverageRouterRedeem,
  writeLeverageRouterRedeem,
} from '@/lib/contracts/generated'

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
      const { request } = await simulateLeverageRouterRedeem(config, {
        args: [token, sharesToRedeem, minCollateral],
        account,
      })
      const hash = await writeLeverageRouterRedeem(config, { ...request })
      return { hash }
    },
  }
}
