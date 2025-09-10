import type { Address } from 'viem'

/**
 * Contract addresses used across the application
 */
export const CONTRACT_ADDRESSES = {
  STAKED_SEAM: {
    address: '0x73f0849756f6A79C1d536b7abAB1E6955f7172A4' as Address,
    chainId: 8453, // Base Chain
  },
} as const
