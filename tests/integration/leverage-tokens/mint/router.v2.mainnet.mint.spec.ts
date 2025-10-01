import { describe, it, expect } from 'vitest'
import { mainnet } from 'viem/chains'
import { ADDR, CHAIN_ID, mode } from '../../../shared/env'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { withFork } from '../../../shared/withFork'

if (mode !== 'tenderly') {
  throw new Error(
    'Mint integration requires a Tenderly backend. Update test configuration to use Tenderly VNet.',
  )
}

const mintSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

mintSuite('Leverage Router V2 Mint (Tenderly VNet, Mainnet wstETH/WETH 2x)', () => {
  const SLIPPAGE_BPS = 50

  it('mints shares successfully via LiFi debt->collateral swap', async () => {
    await withFork(async ({ account, publicClient, config }) => {
      const prev = process.env['TEST_USE_LIFI']
      process.env['TEST_USE_LIFI'] = '1'
      try {
        const res = await executeSharedMint({
          account,
          publicClient,
          config,
          slippageBps: SLIPPAGE_BPS,
          chainIdOverride: mainnet.id,
          addresses: {
            token: ADDR.leverageToken,
            manager: (ADDR.managerV2 ?? ADDR.manager)!,
            router: (ADDR.routerV2 ?? ADDR.router)!,
            ...(ADDR.uniswapV3 ? { uniswapV3: ADDR.uniswapV3 } : {}),
          },
        })
        expect(res.sharesMinted > 0n).toBe(true)
      } finally {
        if (typeof prev === 'string') process.env['TEST_USE_LIFI'] = prev
        else delete process.env['TEST_USE_LIFI']
      }
    })
  }, 120_000)
})

