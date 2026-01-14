import { useMutation } from '@tanstack/react-query'
import type { Account, Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import type { MintPlan } from '@/domain/mint/planner/plan'
import { getContractAddresses, isSupportedChain } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'

type Args = {
  config: Config
  chainId: number
  account: Address | Account
  token: Address
  plan: MintPlan
}

export function useMintWrite() {
  return useMutation<Hash, Error, Args>({
    mutationFn: async ({ config, chainId, account, token, plan }) => {
      const { multicallExecutor } = getContractAddresses(chainId)
      const executor = multicallExecutor as Address

      if (!executor) {
        throw new Error('Multicall executor not found')
      }

      if (!isSupportedChain(chainId)) {
        throw new Error(`Chain ID ${chainId} not supported`)
      }

      const { request } = await simulateLeverageRouterV2Deposit(config, {
        args: [
          token,
          plan.equityInCollateralAsset,
          plan.flashLoanAmount,
          plan.minShares,
          executor,
          plan.calls,
        ],
        account,
        chainId,
      })

      const hash = await writeLeverageRouterV2Deposit(config, request)

      return hash
    },
  })
}
