import type { Address } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { CHAIN_ID, getAddressesForToken } from '../../../shared/env'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { withFork } from '../../../shared/withFork'
import { MAINNET_TOKEN_CONFIGS } from '../mainnet-tokens.config'

const mintSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

// TODO: Investigate why tests require higher slippage (250-500 bps vs 50 bps)
// Likely due to price discrepancies between CoinGecko (used for slippage calc) and on-chain oracles
describe.each(MAINNET_TOKEN_CONFIGS)('Leverage Router V2 Mint (Mainnet $label)', (config) => {
  mintSuite(`${config.label}`, () => {
    it('mints shares successfully using production config', async () => {
      const addresses = getAddressesForToken(config.key, 'prod')

      await withFork(async ({ account, publicClient, config: wagmiConfig }) => {
        // Use production config (Velora for debt->collateral swap)
        const res = await executeSharedMint({
          account,
          publicClient,
          config: wagmiConfig,
          slippageBps: config.slippageBps,
          richHolderAddress: config.richHolderAddress,
          chainIdOverride: mainnet.id,
          addresses: {
            token: addresses.leverageToken,
            manager: (addresses.managerV2 ?? addresses.manager) as Address,
            router: (addresses.routerV2 ?? addresses.router) as Address,
            multicallExecutor: addresses.multicallExecutor as Address,
            ...(addresses.uniswapV3 ? { uniswapV3: addresses.uniswapV3 } : {}),
          },
        })

        const toleranceBps = BigInt(config.toleranceBps)
        const withinTolerance = (actual: bigint, expected: bigint): boolean => {
          if (expected === 0n) return actual === 0n
          if (actual < 0n) return false
          const lowerBound = (expected * (10_000n - toleranceBps)) / 10_000n
          const upperBound = (expected * (10_000n + toleranceBps)) / 10_000n
          return actual >= lowerBound && actual <= upperBound
        }

        // Minted shares should be within tolerance of previewed shares
        expect(withinTolerance(res.sharesMinted, res.previewShares)).toBe(true)

        // Sanity check: minted shares should meet minimum threshold
        expect(res.sharesMinted).toBeGreaterThanOrEqual(res.minShares)

        // Verify collateral spend equals equity funded
        const collateralSpent = res.collateralBalanceBefore - res.collateralBalanceAfter
        expect(collateralSpent).toBe(res.equityInInputAsset)
      })
    }, 120_000)
  })
})
