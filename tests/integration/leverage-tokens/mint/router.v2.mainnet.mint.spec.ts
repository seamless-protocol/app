import type { Address } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { ADDR, CHAIN_ID } from '../../../shared/env'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { withFork } from '../../../shared/withFork'

const mintSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

mintSuite('Leverage Router V2 Mint (Tenderly VNet, Mainnet wstETH/ETH 25x)', () => {
  const SLIPPAGE_BPS = 50

  it('mints shares successfully', async () => {
    await withFork(async ({ account, publicClient, config }) => {
      const res = await executeSharedMint({
        account,
        publicClient,
        config,
        slippageBps: SLIPPAGE_BPS,
        chainIdOverride: mainnet.id,
        addresses: {
          token: ADDR.leverageToken,
          manager: (ADDR.managerV2 ?? ADDR.manager) as Address,
          router: (ADDR.routerV2 ?? ADDR.router) as Address,
          ...(ADDR.uniswapV3 ? { uniswapV3: ADDR.uniswapV3 } : {}),
        },
      })

      // Verify shares were minted successfully
      expect(res.sharesMinted > 0n).toBe(true)
    })
  }, 120_000)
})
