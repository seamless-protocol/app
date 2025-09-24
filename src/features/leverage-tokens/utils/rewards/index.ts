import type { Address, PublicClient, WalletClient } from 'viem'
import { createLogger } from '@/lib/logger'
import { MerklRewardClaimProvider } from './merkl'
import type { BaseRewardClaimData, RewardClaimFetcher } from './types'

const logger = createLogger('rewards-index')

/**
 * Registry of reward claim providers
 * Just add new providers here and they automatically work!
 */
const REWARD_PROVIDERS: Array<RewardClaimFetcher> = [
  new MerklRewardClaimProvider(),
  // Add more providers here as they're implemented
]

/**
 * Function to fetch claimable rewards using all available providers
 * Returns combined rewards from all providers
 */
export async function fetchClaimableRewards(
  userAddress: Address,
): Promise<Array<BaseRewardClaimData>> {
  const allRewards: Array<BaseRewardClaimData> = []
  const providerPromises = REWARD_PROVIDERS.map(async (provider) => {
    try {
      logger.info('Fetching rewards', { provider: provider.protocolName })
      const rewards = await provider.fetchClaimableRewards(userAddress)
      logger.info('Found rewards', {
        provider: provider.protocolName,
        rewardsCount: rewards.length,
      })
      return rewards
    } catch (error) {
      logger.error('Provider failed', {
        provider: provider.protocolName,
        error,
      })
      return [] // Return empty array for failed providers
    }
  })

  // Execute all providers in parallel
  const providerResults = await Promise.all(providerPromises)

  // Combine all rewards
  for (const rewards of providerResults) {
    allRewards.push(...rewards)
  }

  logger.info('Total rewards found', { totalRewards: allRewards.length })
  return allRewards
}

/**
 * Function to claim rewards using the appropriate provider
 * Returns transaction hash on success
 */
export async function claimRewards(
  userAddress: Address,
  rewards: Array<BaseRewardClaimData>,
  client: { publicClient: PublicClient; walletClient: WalletClient },
): Promise<string> {
  if (rewards.length === 0) {
    throw new Error('No rewards to claim')
  }

  // Group rewards by provider protocol (from metadata)
  const rewardsByProvider = new Map<string, Array<BaseRewardClaimData>>()

  for (const reward of rewards) {
    const protocol = (reward.metadata?.['protocol'] as string) || 'unknown'
    if (!rewardsByProvider.has(protocol)) {
      rewardsByProvider.set(protocol, [])
    }
    rewardsByProvider.get(protocol)?.push(reward)
  }

  // Find the appropriate provider for each group and claim
  const claimPromises: Array<Promise<string>> = []

  for (const [protocol, protocolRewards] of rewardsByProvider.entries()) {
    const provider = REWARD_PROVIDERS.find((p) => p.protocolId === protocol)
    if (!provider) {
      logger.warn('No provider found for protocol', { protocol })
      continue
    }

    const claimPromise = provider.claimRewards(userAddress, protocolRewards, client)
    claimPromises.push(claimPromise)
  }

  if (claimPromises.length === 0) {
    throw new Error('No suitable providers found for the rewards')
  }

  try {
    // Execute all claims in parallel
    const results = await Promise.all(claimPromises)
    // Return the first successful transaction hash
    return results[0] || ''
  } catch (error) {
    logger.error('Claim failed', { error, userAddress })
    throw error
  }
}
