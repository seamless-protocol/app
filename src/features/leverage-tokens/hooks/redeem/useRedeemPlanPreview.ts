import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { planRedeemV2 } from '@/domain/redeem/planner/plan.v2'
import type { QuoteFn } from '@/domain/redeem/planner/types'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'

interface UseRedeemPlanPreviewParams {
  config: Config
  token: Address
  sharesToRedeem: bigint | undefined
  slippageBps: number
  chainId: number
  quote?: QuoteFn
  managerAddress?: Address
  swapKey?: string
  outputAsset?: Address
}

export function useRedeemPlanPreview({
  config,
  token,
  sharesToRedeem,
  slippageBps,
  chainId,
  quote,
  managerAddress,
  swapKey,
  outputAsset,
}: UseRedeemPlanPreviewParams) {
  const enabled =
    typeof sharesToRedeem === 'bigint' && sharesToRedeem > 0n && typeof quote === 'function'

  const keyParams = {
    chainId,
    addr: token,
    amount: sharesToRedeem ?? 0n,
    slippageBps,
    ...(managerAddress ? { managerAddress } : {}),
    ...(swapKey ? { swapKey } : {}),
    ...(outputAsset ? { outputAsset } : {}),
  }

  const query = useQuery({
    queryKey: ltKeys.simulation.redeemPlanKey(keyParams),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => {
      if (!enabled || !quote || typeof sharesToRedeem !== 'bigint') {
        throw new Error('Redeem plan prerequisites missing')
      }

      return planRedeemV2({
        config,
        token,
        sharesToRedeem,
        slippageBps,
        quoteCollateralToDebt: quote,
        chainId,
        ...(managerAddress ? { managerAddress } : {}),
        ...(outputAsset ? { outputAsset } : {}),
      })
    },
  })

  return {
    plan: query.data,
    isLoading: query.isPending || query.isFetching,
    error: query.error,
  }
}
