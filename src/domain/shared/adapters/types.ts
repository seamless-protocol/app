/**
 * Shared types for quote adapters used by both mint and redeem operations.
 */
import type { Address, Hex } from 'viem'

// Quote for external swaps (if needed during operations)
export type BaseQuote = {
  // Expected output (nice-weather) in outToken base units
  out: bigint
  // Guaranteed output after slippage in outToken base units
  minOut?: bigint
  // For exact-out quotes: maximum input the router may spend to achieve `out` under slippage
  maxIn?: bigint
  // Adapter may require native (ETH) input value
  wantsNativeIn?: boolean
  // Optional deadline (if provided by the aggregator/DEX)
  deadline?: bigint
  // Target to approve before submitting calldata
  approvalTarget: Address
  // Calldata to execute the swap on the aggregator/DEX
  calldata: Hex
}

// Velora-specific quote with optional veloraData
// veloraData is ONLY required for exactOut quotes used by redeemWithVelora()
// For exactIn quotes used by regular deposit(), veloraData is not needed
export type VeloraQuote = BaseQuote & {
  // Velora-specific data for redeemWithVelora function
  veloraData?: {
    augustus: Address
    offsets: {
      exactAmount: bigint
      limitAmount: bigint
      quotedAmount: bigint
    }
  }
}

// Type representing Velora quote with required veloraData (used for exactOut)
export type VeloraQuoteWithData = BaseQuote & {
  veloraData: {
    augustus: Address
    offsets: {
      exactAmount: bigint
      limitAmount: bigint
      quotedAmount: bigint
    }
  }
}

export type Quote = BaseQuote | VeloraQuote

export type QuoteIntent = 'exactIn' | 'exactOut'

// Base fields common to all quote requests
type QuoteRequestBase = {
  inToken: Address
  outToken: Address
}

// Exact-in: specify input amount, get output amount
// amountOut is optional and can be used for validation/reference
type QuoteRequestExactIn = QuoteRequestBase & {
  intent: 'exactIn'
  amountIn: bigint
  amountOut?: bigint
}

// Exact-out: specify desired output amount, pay variable input
// amountIn is optional and can be used for reference
type QuoteRequestExactOut = QuoteRequestBase & {
  intent: 'exactOut'
  amountOut: bigint
  amountIn?: bigint
}

/**
 * Discriminated union for quote requests.
 * - exactIn: Requires amountIn, optional amountOut for validation
 * - exactOut: Requires amountOut, optional amountIn for reference
 */
export type QuoteRequest = QuoteRequestExactIn | QuoteRequestExactOut

export type QuoteFn = (args: QuoteRequest) => Promise<Quote>

/**
 * Type guard to check if a quote has veloraData (type narrowing helper).
 * For exactOut quotes from Velora, veloraData is always present.
 */
export function hasVeloraData(quote: Quote): quote is VeloraQuoteWithData {
  return 'veloraData' in quote && quote.veloraData !== undefined
}
