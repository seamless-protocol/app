import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { describe, expect, it } from 'vitest'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { leverageManagerAbi } from '@/lib/contracts/abis/leverageManager'
import { withFork } from '../../../shared/withFork'

describe('Protocol TVL (Anvil Base fork / viem)', () => {
  it('aggregates equity across leverage tokens (debt units)', async () =>
    withFork(async ({ publicClient, ADDR }) => {
      const manager: Address = ADDR.manager

      // Use configured leverage token catalog; limit to Base chain for this fork
      const configs = getAllLeverageTokenConfigs().filter((c) => c.chainId === 8453)
      expect(configs.length).toBeGreaterThan(0)

      const perTokenEquity = await Promise.all(
        configs.map(async (cfg) => {
          const state = (await publicClient.readContract({
            address: manager,
            abi: leverageManagerAbi,
            functionName: 'getLeverageTokenState',
            args: [cfg.address],
          })) as {
            collateralInDebtAsset: bigint
            debt: bigint
            equity: bigint
            collateralRatio: bigint
          }

          // Basic invariants per token
          expect(state.equity).toBeTypeOf('bigint')
          expect(state.equity).toBeGreaterThanOrEqual(0n)

          // Log human-friendly TVL (in debt units)
          const tvlDebtUnits = Number(formatUnits(state.equity, cfg.debtAsset.decimals))
          expect(Number.isFinite(tvlDebtUnits)).toBe(true)
          // eslint-disable-next-line no-console
          console.log(`${cfg.symbol} TVL (debt units):`, tvlDebtUnits)

          return state.equity
        }),
      )

      const totalEquity = perTokenEquity.reduce((sum, v) => sum + v, 0n)
      expect(totalEquity).toBeGreaterThanOrEqual(0n)
      // eslint-disable-next-line no-console
      console.log('Total protocol TVL (equity, debt units):', totalEquity.toString())
    }))

  it('manager-declared assets match config for each leverage token', async () =>
    withFork(async ({ publicClient, ADDR }) => {
      const manager: Address = ADDR.manager
      const configs = getAllLeverageTokenConfigs().filter((c) => c.chainId === 8453)
      expect(configs.length).toBeGreaterThan(0)

      await Promise.all(
        configs.map(async (cfg) => {
          const [collateralAsset, debtAsset] = (await Promise.all([
            publicClient.readContract({
              address: manager,
              abi: leverageManagerAbi,
              functionName: 'getLeverageTokenCollateralAsset',
              args: [cfg.address],
            }),
            publicClient.readContract({
              address: manager,
              abi: leverageManagerAbi,
              functionName: 'getLeverageTokenDebtAsset',
              args: [cfg.address],
            }),
          ])) as [Address, Address]

          // Ensure addresses are valid and aligned with app config (case-insensitive)
          expect(collateralAsset).toMatch(/^0x[a-fA-F0-9]{40}$/)
          expect(debtAsset).toMatch(/^0x[a-fA-F0-9]{40}$/)
          expect(collateralAsset.toLowerCase()).toBe(cfg.collateralAsset.address.toLowerCase())
          expect(debtAsset.toLowerCase()).toBe(cfg.debtAsset.address.toLowerCase())
        }),
      )
    }))
})
