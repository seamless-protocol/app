/**
 * Contract exports
 *
 * This module will export:
 * - Contract addresses
 * - ABIs (once contracts are deployed)
 * - Type-safe contract hooks (via wagmi-cli)
 */

export * from './abis/lendingAdapter'

// Re-export ABIs and wagmi codegen for a stable import surface
export * from './abis/leverageManager'
export * from './abis/leverageRouter'
export * from './abis/leverageRouterV2'
export * from './abis/leverageToken'
export * from './abis/leverageTokenFactory'
export * from './abis/rebalanceAdapter'
export * from './addresses'
// Note: keep codegen exports separate to avoid name collisions with ABIs
