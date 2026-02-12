/**
 * Shared types for quote adapters used by both mint and redeem operations.
 */
import type { Address } from 'viem'
import type { Call } from '@/domain/shared/types'

// Quote for external swaps (if needed during operations)
export type BaseQuote = {
  // Expected output (nice-weather) in outToken base units
  out: bigint
  // Guaranteed output after slippage in outToken base units
  minOut: bigint
  // Expected input (nice-weather) in inToken base units
  in: bigint
  // For exact-out quotes: maximum input the router may spend to achieve `out` under slippage
  maxIn: bigint
  // Adapter may require native (ETH) input value
  wantsNativeIn?: boolean
  // Optional deadline (if provided by the aggregator/DEX)
  deadline?: bigint
  // Target to approve before executing calls
  approvalTarget: Address
  // Explicit call sequence (for single- or multi-step flows)
  calls: Array<Call>
  // Optional identifier for the venue/adapter that produced this quote
  quoteSourceId?: string
  // Human-friendly source/venue name when available
  quoteSourceName: string
}

// Velora-specific quote with required veloraData (used for exactOut)
// veloraData is ONLY required for exactOut quotes used by redeemWithVelora()
// For exactIn quotes used by regular deposit(), veloraData is not needed
export type VeloraQuote = BaseQuote & {
  veloraData: {
    augustus: Address
    offsets: {
      exactAmount: bigint
      limitAmount: bigint
      quotedAmount: bigint
    }
  }
}

export type Quote = BaseQuote

export type QuoteIntent = 'exactIn' | 'exactOut'

// Base fields common to all quote requests
type QuoteRequestBase = {
  inToken: Address
  outToken: Address
  slippageBps: number
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
export function hasVeloraData(quote: Quote): quote is VeloraQuote {
  return 'veloraData' in quote && quote.veloraData !== undefined
}
