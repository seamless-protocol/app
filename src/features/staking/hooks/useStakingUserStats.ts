import { useQuery } from '@tanstack/react-query'
import { type Address, formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { STAKED_SEAM } from '@/lib/contracts/addresses'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'

import { stakingKeys } from '../utils/queryKeys'

export interface StakingUserStats {
  currentHoldingsAmount: string
  currentHoldingsUsdValue: string
}

/**
 * Hook to fetch user-specific staking statistics
 * Uses real blockchain data for user's staked balance and USD values
 */
export function useStakingUserStats() {
  const { address: user } = useAccount()

  // Get user's staked SEAM balance
  const {
    balance: stakedBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useTokenBalance({
    tokenAddress: STAKED_SEAM.address,
    userAddress: user as Address,
    chainId: STAKED_SEAM.chainId,
    enabled: Boolean(user),
  })

  // Get USD price for staked SEAM
  const { data: usdPriceMap } = useUsdPrices({
    chainId: STAKED_SEAM.chainId,
    addresses: [STAKED_SEAM.address],
    enabled: Boolean(STAKED_SEAM.address),
  })

  return useQuery({
    queryKey: [...stakingKeys.userPosition(), stakedBalance?.toString(), usdPriceMap],
    queryFn: async (): Promise<StakingUserStats> => {
      // Convert BigInt balance to formatted string (assuming 18 decimals for stkSEAM)
      const formattedBalance = stakedBalance ? formatUnits(stakedBalance, 18) : '0.00'

      // Calculate USD value
      const stakedSeamPrice = usdPriceMap?.[STAKED_SEAM.address.toLowerCase()]
      const balanceNumber = parseFloat(formattedBalance)
      const usdValue =
        stakedSeamPrice && Number.isFinite(stakedSeamPrice) ? balanceNumber * stakedSeamPrice : 0

      return {
        currentHoldingsAmount: `${formattedBalance} stkSEAM`,
        currentHoldingsUsdValue: `$${usdValue.toFixed(2)}`,
      }
    },
    enabled: !isBalanceLoading && !isBalanceError,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 1 * 60 * 1000, // 1 minute
  })
}
