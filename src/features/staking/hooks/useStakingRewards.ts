import { useQuery } from '@tanstack/react-query'
import { type Address, formatUnits } from 'viem'
import { useAccount, useReadContract } from 'wagmi'

import { STAKED_SEAM, seamlessContracts } from '@/lib/contracts/addresses'

import { stakingKeys } from '../utils/queryKeys'

export interface StakingRewardsData {
  claimableRewardsAmount: string
}

/**
 * Hook to fetch user's claimable staking rewards
 * Calls the rewards controller contract to get actual rewards data
 */
export function useStakingRewards() {
  const { address: user } = useAccount()

  // Get user rewards from rewards controller
  const rewardsControllerAddress = seamlessContracts[STAKED_SEAM.chainId]?.rewardsController

  if (!user) {
    throw new Error('User address is required to fetch staking rewards')
  }
  if (!rewardsControllerAddress) {
    throw new Error('Rewards controller address not found for current chain')
  }

  const {
    data: userRewards,
    isLoading,
    isError,
  } = useReadContract({
    address: rewardsControllerAddress,
    abi: [
      {
        name: 'getAllUserRewards',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'rewardsAccruingAssets', type: 'address[]' },
          { name: 'user', type: 'address' },
        ],
        outputs: [
          { name: 'rewardTokenList', type: 'address[]' },
          { name: 'unclaimedBalances', type: 'uint256[]' },
        ],
      },
    ] as const,
    functionName: 'getAllUserRewards',
    args: [[STAKED_SEAM.address], user],
    chainId: STAKED_SEAM.chainId,
    query: {
      enabled: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 1 * 60 * 1000, // 1 minute
    },
  })

  return useQuery({
    queryKey: stakingKeys.rewards(user),
    queryFn: async (): Promise<StakingRewardsData> => {
      if (!userRewards) {
        return {
          claimableRewardsAmount: '0.00 SEAM',
        }
      }

      // userRewards is now [rewardTokenList, unclaimedBalances]
      const [, unclaimedBalances] = userRewards as [Array<Address>, Array<bigint>]

      // Sum up all unclaimed balances (assuming 18 decimals for SEAM)
      const totalRewards = unclaimedBalances.reduce((sum, balance) => sum + balance, 0n)
      const formattedRewards = formatUnits(totalRewards, 18)

      return {
        claimableRewardsAmount: `${formattedRewards} SEAM`,
      }
    },
    enabled: Boolean(user && rewardsControllerAddress && !isLoading && !isError),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 1 * 60 * 1000, // 1 minute
  })
}
