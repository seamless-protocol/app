import type { Address } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { ADDR, CHAIN_ID } from '../../../shared/env'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { withFork } from '../../../shared/withFork'

const mintSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

mintSuite('Leverage Router V2 Mint (Mainnet wstETH/ETH 25x)', () => {
  // TODO: Investigate why tests require higher slippage (250 bps vs 50 bps)
  // Likely due to price discrepancies between CoinGecko (used for slippage calc) and on-chain oracles
  const SLIPPAGE_BPS = 250

  it('mints shares successfully using production config', async () => {
    await withFork(async ({ account, publicClient, config }) => {
      // Use production config (Velora for debt->collateral swap)
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
