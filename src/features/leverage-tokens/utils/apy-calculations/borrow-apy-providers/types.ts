import type { Address } from 'viem'
import type { Config } from 'wagmi'

/**
 * Common interface for borrow APY data that all protocols must implement
 */
export interface BaseBorrowApyData {
  /** Borrow APY as a decimal (e.g., 0.05 for 5%) */
  borrowAPY: number
  /** Market utilization as a percentage (e.g., 85 for 85%) */
  utilization?: number
}

/**
 * Protocol-specific borrow APY fetcher interface
 */
export interface BorrowApyFetcher {
  /** Unique identifier for this protocol */
  protocolId: string
  /** Human-readable name */
  protocolName: string
  /** Fetch borrow APY data for this protocol */
  fetchBorrowApy(
    tokenAddress: Address,
    chainId?: number,
    config?: Config,
  ): Promise<BaseBorrowApyData>
}
