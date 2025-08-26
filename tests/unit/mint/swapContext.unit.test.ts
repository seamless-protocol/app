import { describe, it, expect } from 'vitest'
import { createSwapContext, createWeETHSwapContext, BASE_TOKEN_ADDRESSES } from '../../../src/domain/mint-with-router'

describe('swapContext helpers', () => {
  it('createWeETHSwapContext returns EtherFi config with empty paths', () => {
    const ctx = createWeETHSwapContext()
    expect(ctx.path.length).toBe(0)
    expect(ctx.encodedPath).toBe('0x')
    expect(ctx.fees.length).toBe(0)
    expect(ctx.tickSpacing.length).toBe(0)
    // exchangeAddresses should have known routers on Base
    expect(ctx.exchangeAddresses.aerodromeRouter).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('createSwapContext for Base returns a V2-style context by default', () => {
    const from = BASE_TOKEN_ADDRESSES.weETH
    const to = '0x0000000000000000000000000000000000000001' as `0x${string}`
    const ctx = createSwapContext(from, to, 8453)
    expect(ctx.path).toEqual([from, to])
    expect(ctx.encodedPath).toBe('0x')
    expect(ctx.fees[0]).toBe(0)
    expect(ctx.tickSpacing[0]).toBe(0)
  })
})

