import { useMutation } from '@tanstack/react-query'
import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import { useChainId, useSwitchChain } from 'wagmi'
import type { MintPlanV2 } from '@/domain/mint/planner/plan.v2'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'

type Args = {
  config: Config
  chainId: SupportedChainId
  account: Address
  token: Address
  plan: Pick<
    MintPlanV2,
    | 'inputAsset'
    | 'equityInInputAsset'
    | 'minShares'
    | 'calls'
    | 'expectedTotalCollateral'
    | 'expectedDebt'
  >
}

export function useMintWrite(key?: {
  chainId: SupportedChainId
  token: Address
  account: Address
  plan?: Args['plan']
}) {
  const activeChainId = useChainId()
  const { switchChainAsync } = useSwitchChain()

  const mutationKey = key
    ? ltKeys.mutations.mintWrite({
        chainId: key.chainId,
        addr: key.token,
        account: key.account,
        planSig: makePlanSig(key.plan),
      })
    : (['leverage-tokens', 'mutate', 'mint'] as const)

  return useMutation<Hash, Error, Args>({
    mutationKey,
    mutationFn: async ({ config, chainId, account, token, plan }) => {
      if (activeChainId !== chainId) {
        await switchChainAsync({ chainId })
      }

      const { multicallExecutor } = getContractAddresses(chainId)
      const executor = multicallExecutor as Address

      const { request } = await simulateLeverageRouterV2Deposit(config, {
        args: [
          token,
          plan.equityInInputAsset,
          plan.expectedDebt,
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

function makePlanSig(plan?: Args['plan']): string {
  try {
    if (!plan) return 'na'
    const eq = plan.equityInInputAsset.toString()
    const debt = plan.expectedDebt.toString()
    const min = plan.minShares.toString()
    const len = plan.calls?.length ?? 0
    const c0 = plan.calls?.[0]
    const c0sig = c0 ? `${c0.target}:${String(c0.data).slice(0, 10)}:${c0.value.toString()}` : 'na'
    return `eq:${eq}|debt:${debt}|min:${min}|calls:${len}|c0:${c0sig}`
  } catch {
    return 'plan'
  }
}
