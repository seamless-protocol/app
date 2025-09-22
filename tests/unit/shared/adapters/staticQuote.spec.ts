import type { Address, Hex } from 'viem'
import { describe, expect, it } from 'vitest'
import {
  createStaticQuoteAdapter,
  normalizeStaticQuote,
  type StaticQuoteSnapshot,
} from '../../../shared/adapters/staticQuote'

describe('static quote adapter', () => {
  const baseSnapshot: StaticQuoteSnapshot = {
    inToken: '0x4200000000000000000000000000000000000006' as Address,
    outToken: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address,
    amountIn: 100000000000000000n,
    amountOut: 92184717051161597n,
    minAmountOut: 92100000000000000n,
    approvalTarget: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE' as Address,
    callTarget: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE' as Address,
    calldata: '0xdeadbeef' as Hex,
  }

  it('returns deterministic quote when inputs match snapshot', async () => {
    const quoteFn = createStaticQuoteAdapter({ snapshot: baseSnapshot, label: 'test' })

    const quote = await quoteFn({
      inToken: baseSnapshot.inToken,
      outToken: baseSnapshot.outToken,
      amountIn: baseSnapshot.amountIn,
    })

    expect(quote.out).toBe(baseSnapshot.amountOut)
    expect(quote.minOut).toBe(baseSnapshot.minAmountOut)
    expect(quote.approvalTarget).toBe(baseSnapshot.approvalTarget)
    expect(quote.calldata).toBe(baseSnapshot.calldata)
  })

  it('throws when amountIn drifts by default', async () => {
    const quoteFn = createStaticQuoteAdapter({ snapshot: baseSnapshot })

    await expect(
      quoteFn({
        inToken: baseSnapshot.inToken,
        outToken: baseSnapshot.outToken,
        amountIn: baseSnapshot.amountIn + 1n,
      }),
    ).rejects.toThrow(/amountIn/)
  })

  it('throws when token mismatch detected', async () => {
    const quoteFn = createStaticQuoteAdapter({ snapshot: baseSnapshot })
    await expect(
      quoteFn({
        inToken: '0x0000000000000000000000000000000000000001' as Address,
        outToken: baseSnapshot.outToken,
        amountIn: baseSnapshot.amountIn,
      }),
    ).rejects.toThrow(/inToken/)
  })

  it('normalizes raw LiFi quote payloads', () => {
    const normalized = normalizeStaticQuote({
      action: {
        fromToken: { address: '0x4200000000000000000000000000000000000006' },
        toToken: { address: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' },
        fromAmount: '100000000000000000',
      },
      estimate: {
        toAmount: '92184717051161597',
        toAmountMin: '92000000000000000',
        approvalAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
      },
      transactionRequest: {
        to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
        data: '0xdeadbeef',
      },
    })

    expect(normalized.inToken).toBe(baseSnapshot.inToken)
    expect(normalized.outToken).toBe(baseSnapshot.outToken)
    expect(normalized.amountIn).toBe(baseSnapshot.amountIn)
    expect(normalized.amountOut).toBe(92184717051161597n)
    expect(normalized.minAmountOut).toBe(92000000000000000n)
    expect(normalized.approvalTarget).toBe(baseSnapshot.approvalTarget)
    expect(normalized.callTarget).toBe(baseSnapshot.approvalTarget)
    expect(normalized.calldata).toBe('0xdeadbeef')
  })
})
