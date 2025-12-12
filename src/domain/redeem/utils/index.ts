// Redeem domain utilities
// Re-exports for clean imports

// Quote creation helpers
export {
  type CollateralToDebtSwapConfig,
  type CreateCollateralToDebtQuoteParams,
  type CreateCollateralToDebtQuoteResult,
  createCollateralToDebtQuote,
} from './createCollateralToDebtQuote'

// Slippage calculations
export {
  calculateActualSlippage,
  calculateMinCollateralForSender,
} from './slippage'
