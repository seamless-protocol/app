// Redeem-specific constants and shared utilities

// Re-export shared constants
export { BPS_DENOMINATOR, DEFAULT_SLIPPAGE_BPS } from '../../shared/adapters/constants'

// Redeem-specific constants
// Default cap for redemption swap costs (2% - same as mint for consistency)
export const DEFAULT_MAX_REDEEM_SWAP_COST_BPS = 200n

// Minimum redemption amount in basis points (0.01% to prevent dust)
export const MIN_REDEEM_AMOUNT_BPS = 1n
