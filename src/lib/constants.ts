import type { Address } from 'viem'

/**
 * Contract addresses used across the application
 */
export const CONTRACT_ADDRESSES = {
  /**
   * Staked SEAM token address on Base Chain
   */
  STAKED_SEAM: '0x73f0849756f6A79C1d536b7abAB1E6955f7172A4' as Address,
} as const
