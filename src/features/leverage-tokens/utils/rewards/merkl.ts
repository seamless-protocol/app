import type { Address, PublicClient, WalletClient } from 'viem'
import { merklDistributorAbi } from '@/lib/contracts/abis/merklDistributor'
import { CHAIN_IDS } from '@/lib/utils/chain-logos'
import { getAllLeverageTokenConfigs } from '../../leverageTokens.config'
import type { BaseRewardClaimData, RewardClaimFetcher } from './types'

/**
 * Supported chain IDs for Merkl rewards
 */
export const SUPPORTED_CHAIN_IDS = [CHAIN_IDS.BASE, CHAIN_IDS.ETHEREUM] as const

/**
 * Merkl distributor contract addresses by chain ID
 */
const MERKL_DISTRIBUTOR_ADDRESSES: Record<number, Address> = {
  [CHAIN_IDS.BASE]: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as Address,
  [CHAIN_IDS.ETHEREUM]: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as Address,
  // Add other chains as needed
}

// Types for Merkl API responses
interface MerklReward {
  amount: string // Total amount ever earned
  claimed: string // Amount already claimed
  pending: string // Amount available to claim
  token: {
    address: string
    symbol: string
    decimals: number
  }
  proofs: Array<string>
}

interface MerklUserRewards {
  chain: {
    id: number
  }
  rewards: Array<MerklReward>
}

/**
 * Merkl rewards claim provider implementation
 *
 * This provider fetches and claims rewards from Merkl for Seamless leverage tokens.
 * It filters rewards to only include those related to Seamless leverage tokens.
 */
export class MerklRewardClaimProvider implements RewardClaimFetcher {
  protocolId = 'merkl'
  protocolName = 'Merkl'

  private readonly supportedChainIds: ReadonlyArray<number>
  private readonly distributorAddresses: Record<number, Address>

  constructor() {
    this.supportedChainIds = SUPPORTED_CHAIN_IDS
    this.distributorAddresses = MERKL_DISTRIBUTOR_ADDRESSES

    // Validate that all supported chains have distributor addresses
    for (const chainId of this.supportedChainIds) {
      if (!this.distributorAddresses[chainId]) {
        throw new Error(`Merkl distributor address not found for chain ID: ${chainId}`)
      }
    }
  }

  /**
   * Fetch claimable rewards for a user from Merkl
   * Filters to only include rewards related to Seamless leverage tokens
   */
  async fetchClaimableRewards(userAddress: Address): Promise<Array<BaseRewardClaimData>> {
    try {
      // Fetch user rewards from Merkl API for all supported chains
      const userRewards = await this.fetchUserRewardsFromMerkl(userAddress, this.supportedChainIds)

      if (!userRewards || userRewards.length === 0) {
        console.log('[Merkl] No rewards found for user')
        return []
      }

      // Convert all rewards to BaseRewardClaimData format
      const allRewards: Array<BaseRewardClaimData> = []

      for (const rewardData of userRewards) {
        for (const reward of rewardData.rewards) {
          // Include all rewards (both claimed and pending) for UI display
          // The UI can decide what to show based on the amounts
          const hasClaimable = BigInt(reward.pending) > 0n
          const hasClaimed = BigInt(reward.claimed) > 0n

          // Only include rewards that have either pending or claimed amounts
          if (hasClaimable || hasClaimed) {
            const claimData: BaseRewardClaimData = {
              claimableAmount: reward.pending, // Use pending amount as claimable
              tokenAddress: reward.token.address as Address,
              tokenSymbol: reward.token.symbol,
              tokenDecimals: reward.token.decimals,
              chainId: rewardData.chain.id,
              proof: reward.proofs,
              metadata: {
                protocol: 'merkl',
                totalAmount: reward.amount, // Total amount ever earned
                claimedAmount: reward.claimed, // Amount already claimed
                pendingAmount: reward.pending, // Amount available to claim
                hasClaimable, // Boolean for easy UI checks
                hasClaimed, // Boolean for easy UI checks
              },
            }

            allRewards.push(claimData)
          }
        }
      }

      console.log(`[Merkl] Found ${allRewards.length} rewards (claimed + pending)`)
      // Filter to only include Seamless-related rewards
      const seamlessRewards = this.filterSeamlessRewards(allRewards)

      console.log(`[Merkl] Found ${seamlessRewards.length} Seamless-related claimable rewards`)
      return seamlessRewards
    } catch (error) {
      console.error('[Merkl] Error fetching claimable rewards:', error)
      throw error
    }
  }

  /**
   * Claim rewards using Merkl distributor contract
   */
  async claimRewards(
    userAddress: Address,
    rewards: Array<BaseRewardClaimData>,
    client: any, // Viem client with wallet capabilities
  ): Promise<string> {
    try {
      console.log(`[Merkl] Claiming ${rewards.length} rewards for user: ${userAddress}`)

      if (rewards.length === 0) {
        throw new Error('No rewards to claim')
      }

      // Group rewards by token for efficient claiming
      const rewardsByToken = this.groupRewardsByToken(rewards)

      let totalClaimed = 0
      const claimPromises = []

      for (const [tokenAddress, tokenRewards] of rewardsByToken.entries()) {
        // Get the chain ID for this token (all rewards in a group should have the same chain ID)
        const chainId = tokenRewards[0]?.chainId
        if (!chainId || !this.supportedChainIds.includes(chainId)) {
          console.warn(`[Merkl] Skipping rewards for unsupported chain: ${chainId}`)
          continue
        }

        const distributorAddress = this.distributorAddresses[chainId]
        if (!distributorAddress) {
          console.warn(`[Merkl] Skipping rewards for unsupported chain: ${chainId}`)
          continue
        }

        const claimPromise = this.claimTokenRewards(
          client.publicClient,
          client.walletClient,
          userAddress,
          tokenAddress,
          tokenRewards,
          distributorAddress,
        )
        claimPromises.push(claimPromise)
      }

      // Execute all claims in parallel
      const results = await Promise.all(claimPromises)
      totalClaimed = results.reduce((sum, result) => sum + (result.success ? 1 : 0), 0)

      console.log(`[Merkl] Successfully claimed ${totalClaimed}/${rewards.length} reward types`)

      // Return the first successful transaction hash
      const successfulResult = results.find((result) => result.success)
      if (!successfulResult || !successfulResult.transactionHash) {
        throw new Error('All claim transactions failed')
      }

      return successfulResult.transactionHash
    } catch (error) {
      console.error('[Merkl] Error claiming rewards:', error)
      throw error
    }
  }

  /**
   * Fetch user rewards from Merkl API for multiple chains
   */
  private async fetchUserRewardsFromMerkl(
    userAddress: Address,
    chainIds: ReadonlyArray<number>,
  ): Promise<Array<MerklUserRewards>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const url = `https://api.merkl.xyz/v4/users/${userAddress}/rewards?chainId=${chainIds.join(',')}`

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('[Merkl] No rewards found for user:', userAddress)
          return []
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[Merkl] Request timeout while fetching user rewards')
      } else {
        console.error('[Merkl] Error fetching user rewards:', error)
      }
      throw error
    }
  }

  /**
   * Filter rewards to only include those related to Seamless leverage tokens
   */
  private filterSeamlessRewards(rewards: Array<BaseRewardClaimData>): Array<BaseRewardClaimData> {
    const leverageTokenConfigs = getAllLeverageTokenConfigs()
    const leverageTokenAddresses = new Set(
      leverageTokenConfigs.map((config) => config.address.toLowerCase()),
    )

    return rewards.filter((reward) => {
      // Check if this reward's token address matches any Seamless leverage token
      return leverageTokenAddresses.has(reward.tokenAddress.toLowerCase())
    })
  }

  /**
   * Group rewards by token address for efficient claiming
   */
  private groupRewardsByToken(
    rewards: Array<BaseRewardClaimData>,
  ): Map<Address, Array<BaseRewardClaimData>> {
    const grouped = new Map<Address, Array<BaseRewardClaimData>>()

    for (const reward of rewards) {
      const existing = grouped.get(reward.tokenAddress) || []
      existing.push(reward)
      grouped.set(reward.tokenAddress, existing)
    }

    return grouped
  }

  /**
   * Claim rewards for a specific token using the Merkl distributor contract
   */
  private async claimTokenRewards(
    publicClient: PublicClient,
    walletClient: WalletClient,
    userAddress: Address,
    tokenAddress: Address,
    rewards: Array<BaseRewardClaimData>,
    distributorAddress: Address,
    simulateContract?: PublicClient['simulateContract'],
    writeContract?: WalletClient['writeContract'],
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Prepare claim data following Merkl's expected format
      const users = rewards.map(() => userAddress)
      const tokens = rewards.map(() => tokenAddress)
      const amounts = rewards.map((reward) => BigInt(reward.claimableAmount))
      const proofs = rewards.map((reward) => reward.proof as ReadonlyArray<`0x${string}`>)

      console.log(`[Merkl] Claiming ${rewards.length} rewards for token: ${tokenAddress}`)

      const simulate = simulateContract ?? publicClient.simulateContract
      const write = writeContract ?? walletClient.writeContract

      const simulation = await simulate({
        address: distributorAddress,
        abi: merklDistributorAbi,
        functionName: 'claim',
        args: [users, tokens, amounts, proofs],
        account: userAddress,
      })

      console.log(`[Merkl] Simulation successful. Gas estimate: ${simulation.request.gas}`)

      // Now execute the actual transaction
      console.log(`[Merkl] Executing claim transaction...`)
      const txHash = await write(simulation.request)

      return {
        success: true,
        transactionHash: txHash,
      }
    } catch (error) {
      console.error(`[Merkl] Error claiming token rewards for ${tokenAddress}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
