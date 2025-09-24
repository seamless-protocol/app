import { useQuery } from '@tanstack/react-query'
import { type Address, formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { fetchUserLeverageTokenPosition } from '@/lib/graphql/fetchers/leverage-tokens'
import { STALE_TIME } from '../utils/constants'
import { ltKeys } from '../utils/queryKeys'

interface UseLeverageTokenUserMetricsParams {
  tokenAddress?: Address
  chainId?: number
  collateralDecimals: number
  userAddress?: Address
}

export interface LeverageTokenUserMetricsData {
  depositedCollateral: bigint
  depositedCollateralFormatted: string
  depositedDebt: bigint
}

export function useLeverageTokenUserMetrics({
  tokenAddress,
  chainId,
  collateralDecimals,
  userAddress: overrideUserAddress,
}: UseLeverageTokenUserMetricsParams) {
  const { address: connectedAddress } = useAccount()
  const userAddress = overrideUserAddress ?? (connectedAddress as Address | undefined)

  const shouldQuery = Boolean(tokenAddress && userAddress && typeof chainId === 'number')

  const queryKey = shouldQuery
    ? ([...ltKeys.user(tokenAddress as Address, userAddress as Address), 'metrics'] as const)
    : (['leverage-tokens', 'user-metrics', 'disabled'] as const)

  return useQuery<LeverageTokenUserMetricsData>({
    queryKey,
    queryFn: async () => {
      const result = await fetchUserLeverageTokenPosition({
        userAddress: userAddress as Address,
        leverageTokenAddress: tokenAddress as Address,
        chainId: chainId as number,
      })

      const position = result.user?.positions?.[0]
      const depositedCollateral = BigInt(position?.totalEquityDepositedInCollateral ?? '0')
      const depositedDebt = BigInt(position?.totalEquityDepositedInDebt ?? '0')

      return {
        depositedCollateral,
        depositedCollateralFormatted: formatUnits(depositedCollateral, collateralDecimals),
        depositedDebt,
      }
    },
    enabled: shouldQuery,
    staleTime: STALE_TIME.balance,
  })
}
