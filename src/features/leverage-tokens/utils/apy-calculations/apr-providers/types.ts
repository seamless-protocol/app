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
  /** Description of the averaging period used for calculation (e.g., "24-hour average", "7-day average") */
  averagingPeriod?: string
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
  fetchApr(collateralSymbol?: string): Promise<BaseAprData>
}
