import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { planMint } from '@/domain/mint/planner/plan'

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(
      async () => '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
    ),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(
      async () => '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address,
    ),
    readLeverageRouterV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      // Make targetCollateral equal to userCollateral so neededFromDebtSwap == 0
      return {
        collateral: equity,
        debt: 0n,
        shares: equity,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

// Decimals are now passed as parameters instead of being fetched on-chain

describe('planMint error branches', () => {
  it('throws when input != collateral', async () => {
    await expect(
      planMint({
        config: {} as any,
        token: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address,
        inputAsset: '0x9999999999999999999999999999999999999999' as Address,
        equityInInputAsset: 1_000n,
        slippageBps: 50,
        quoteDebtToCollateral: async () => ({
          out: 100n,
          approvalTarget: '0x3333333333333333333333333333333333333333' as Address,
          calldata: '0x' as `0x${string}`,
        }),
        chainId: 8453,
        collateralAsset: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
        debtAsset: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address,
        collateralAssetDecimals: 18,
        debtAssetDecimals: 18,
      }),
    ).rejects.toThrowError(/collateral-only/i)
  })

  it('throws when preview indicates no debt swap needed', async () => {
    const inputAsset = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address
    await expect(
      planMint({
        config: {} as any,
        token: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address,
        inputAsset,
        equityInInputAsset: 1_000n,
        slippageBps: 50,
        quoteDebtToCollateral: async () => ({
          out: 0n,
          approvalTarget: '0x3333333333333333333333333333333333333333' as Address,
          calldata: '0x' as `0x${string}`,
        }),
        chainId: 8453,
        collateralAsset: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
        debtAsset: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address,
        collateralAssetDecimals: 18,
        debtAssetDecimals: 18,
      }),
    ).rejects.toThrowError(/no debt swap needed/i)
  })
})
