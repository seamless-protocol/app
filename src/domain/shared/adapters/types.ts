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

// Velora-specific quote where veloraData is REQUIRED
export type VeloraQuote = BaseQuote & {
  // Velora-specific data for redeemWithVelora function
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

export type QuoteRequest = {
  inToken: Address
  outToken: Address
  amountIn: bigint
  /** Optional desired output when requesting an exact-out quote. */
  amountOut?: bigint
  /** Optional intent flag to switch between exact-in and exact-out sizing. */
  intent?: QuoteIntent
}

export type QuoteFn = (args: QuoteRequest) => Promise<Quote>
