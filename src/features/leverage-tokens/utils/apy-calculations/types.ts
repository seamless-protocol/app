/**
 * Common interface for APR data that all protocols must implement
 */
export interface BaseAprData {
  /** Primary staking/yield APR */
  stakingAPR: number
  /** Additional restaking/rewards APR */
  restakingAPR?: number
  /** Total combined APR */
  totalAPR: number
  /** Total Value Locked */
  tvl?: number
  /** Additional protocol-specific data */
  metadata?: Record<string, any>
}

/**
 * Protocol-specific APR fetcher interface
 */
export interface AprFetcher {
  /** Unique identifier for this protocol */
  protocolId: string
  /** Human-readable name */
  protocolName: string
  /** Fetch APR data for this protocol */
  fetchApr(): Promise<BaseAprData>
}
