import type { Address, PublicClient, WalletClient } from 'viem'

/**
 * Reward metadata interface for typed access to reward properties
 */
export interface RewardMetadata {
  /** Protocol identifier */
  protocol: string
  /** Total amount ever earned */
  totalAmount: string
  /** Amount already claimed */
  claimedAmount: string
  /** Amount available to claim */
  pendingAmount: string
  /** Boolean for easy UI checks */
  hasClaimable: boolean
  /** Boolean for easy UI checks */
  hasClaimed: boolean
  /** Token price in USD */
  tokenPrice?: number
}

/**
 * Base interface for reward claim data
 */
export interface BaseRewardClaimData {
  /** Total claimable amount in token units */
  claimableAmount: string
  /** Token address for the reward */
  tokenAddress: Address
  /** Token symbol */
  tokenSymbol: string
  /** Token decimals */
  tokenDecimals: number
  /** Chain ID where rewards are claimable */
  chainId: number
  /** Proof data needed for claiming (provider-specific) */
  proof: Array<string>
  /** Additional metadata for the claim */
  metadata?: RewardMetadata
}

/**
 * Protocol-specific reward claim fetcher interface
 */
export interface RewardClaimFetcher {
  /** Unique identifier for this protocol */
  protocolId: string
  /** Human-readable name */
  protocolName: string
  /** Fetch claimable rewards for a user address */
  fetchClaimableRewards(userAddress: Address): Promise<Array<BaseRewardClaimData>>
  /** Claim rewards for a user (returns transaction hash) */
  claimRewards(
    userAddress: Address,
    rewards: Array<BaseRewardClaimData>,
    client: { publicClient: PublicClient; walletClient: WalletClient },
  ): Promise<string>
}

/**
 * Result of a reward claim operation
 */
export interface RewardClaimResult {
  /** Transaction hash of the claim transaction */
  transactionHash: string
  /** Success status */
  success: boolean
  /** Error message if claim failed */
  error?: string
  /** Amount claimed */
  amountClaimed: string
  /** Token address of claimed rewards */
  tokenAddress: Address
}
