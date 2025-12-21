import type { Address } from 'viem'
import { parseUnits } from 'viem'
import { base, mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'

const LIVE = process.env['LIFI_LIVE'] === '1'

const QUOTE_TARGETS: Array<{
  label: string
  chainId: number
  router: Address
  inToken: Address
  outToken: Address
  amountIn?: bigint
}> = [
  {
    label: 'Base WETH → weETH',
    chainId: base.id,
    router: '0xfd46483b299197c616671b7df295ca5186c805c2' as Address,
    inToken: '0x4200000000000000000000000000000000000006' as Address,
    outToken: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150a' as Address,
    amountIn: parseUnits('0.5', 18),
  },
  {
    label: 'Mainnet WETH → weETH',
    chainId: mainnet.id,
    router: '0x71E826cC335DaBac3dAF4703B2119983e1Bc843B' as Address,
    inToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
    outToken: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee' as Address,
    amountIn: parseUnits('0.5', 18),
  },
  {
    label: 'Mainnet wstETH → WETH',
    chainId: mainnet.id,
    router: '0xb0764dE7eeF0aC69855C431334B7BC51A96E6DbA' as Address,
    inToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address, // wstETH
    outToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address, // WETH
    amountIn: parseUnits('0.5', 18),
  },
]

const describeOrSkip = LIVE ? describe : describe.skip

describeOrSkip('LiFi adapter live smoke', () => {
  for (const target of QUOTE_TARGETS) {
    it(`returns approvalTarget, calls, and out > 0 (${target.label})`, async () => {
      const quote = createLifiQuoteAdapter({
        chainId: target.chainId,
        router: target.router,
      })

      const res = await quote({
        inToken: target.inToken,
        outToken: target.outToken,
        amountIn: target.amountIn ?? parseUnits('0.5', 18),
        intent: 'exactIn',
        slippageBps: 50,
      })

      expect((res.calls[0]?.data ?? '').startsWith('0x')).toBe(true)
      expect(/^0x[a-fA-F0-9]{40}$/.test(res.approvalTarget)).toBe(true)
      expect(res.out).toBeGreaterThan(0n)
    })

    it(`returns maxIn and minOut >= requested (exact-out) (${target.label})`, async () => {
      // Use a higher slippage for exact-out to reduce quote misses on LiFi
      const quote = createLifiQuoteAdapter({
        chainId: target.chainId,
        router: target.router,
      })

      // Use a small target on Base and a larger one on Mainnet to avoid min-size issues
      const toAmount =
        target.chainId === mainnet.id ? parseUnits('0.2', 18) : parseUnits('0.005', 18)

      const res = await quote({
        inToken: target.inToken,
        outToken: target.outToken,
        amountIn: 0n,
        amountOut: toAmount,
        intent: 'exactOut',
        slippageBps: 150, // 1.50%
      })

      expect((res.calls[0]?.data ?? '').startsWith('0x')).toBe(true)
      expect(/^0x[a-fA-F0-9]{40}$/.test(res.approvalTarget)).toBe(true)
      // Adapter maps out := toAmountMin || toAmount
      expect(res.out).toBeGreaterThanOrEqual(toAmount)
      expect(typeof res.maxIn === 'bigint').toBe(true)
      expect((res.maxIn ?? 0n) > 0n).toBe(true)
    })
  }
})
