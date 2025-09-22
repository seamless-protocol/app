// Redeem domain utilities
// Re-exports for clean imports

// Constants
export * from './constants'

// Quote creation helpers
export {
  type CollateralToDebtSwapConfig,
  type CreateCollateralToDebtQuoteParams,
  type CreateCollateralToDebtQuoteResult,
  createCollateralToDebtQuote,
} from './createCollateralToDebtQuote'

// Version detection
export { detectRedeemRouterVersion } from './detectVersion'

// Slippage calculations
export {
  calculateActualSlippage,
  calculateMinCollateralForSender,
} from './slippage'
