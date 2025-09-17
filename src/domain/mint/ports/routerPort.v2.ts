import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import {
  readLeverageRouterV2PreviewDeposit,
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'

// Infer swap calls tuple type from generated action signature
type DepositParams = Parameters<typeof simulateLeverageRouterV2Deposit>[1]
type V2Calls = DepositParams['args'][5]

export interface RouterPortV2PreviewResult {
  collateral: bigint
  debt: bigint
  shares: bigint
}

export interface RouterPortV2 {
  mode: 'v2'
  supportsUserConversion: boolean
  previewDeposit(args: {
    token: Address
    collateralFromSender: bigint
  }): Promise<RouterPortV2PreviewResult>
  invokeMint(args: {
    token: Address
    collateralFromSender: bigint
    flashLoanAmount: bigint
    minShares: bigint
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
    async previewDeposit({ token, collateralFromSender }) {
      const res = await readLeverageRouterV2PreviewDeposit(config, {
        address: routerAddress,
        args: [token, collateralFromSender],
      })
      return { collateral: res.collateral, debt: res.debt, shares: res.shares }
    },
    async invokeMint({
      token,
      collateralFromSender,
      flashLoanAmount,
      minShares,
      multicallExecutor,
      calls,
      account,
    }) {
      const { request } = await simulateLeverageRouterV2Deposit(config, {
        address: routerAddress,
        args: [token, collateralFromSender, flashLoanAmount, minShares, multicallExecutor, calls],
        account,
      })
      const hash = await writeLeverageRouterV2Deposit(config, { ...request })
      return { hash }
    },
  }
}
