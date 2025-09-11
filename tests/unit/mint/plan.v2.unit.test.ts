import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { planMintV2 } from '@/domain/mint/plan.v2'

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerGetLeverageTokenCollateralAsset: vi.fn(
      async () => '0x1111111111111111111111111111111111111111' as Address,
    ),
    readLeverageManagerGetLeverageTokenDebtAsset: vi.fn(
      async () => '0x2222222222222222222222222222222222222222' as Address,
    ),
    readLeverageManagerPreviewMint: vi.fn(async (_config, { args }: any) => {
      // args: [token, equityInCollateralAsset]
      const equity = args[1] as bigint
      // Simplified, linear preview for testing
      return {
        collateral: equity + 1000n,
        debt: 5000n,
        equity,
        shares: equity,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

describe('planMintV2 validations', () => {
  const cfg = {} as any
  const token = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address

  it('throws when input != collateral and no input converter', async () => {
    await expect(
      planMintV2({
        config: cfg,
        token,
        inputAsset: '0x9999999999999999999999999999999999999999' as Address,
        equityInInputAsset: 1_000_000n,
        slippageBps: 50,
        // missing quoteInputToCollateral on purpose
        quoteDebtToCollateral: async () => ({
          out: 1000n,
          approvalTarget: '0x3333333333333333333333333333333333333333' as Address,
          calldata: '0x',
        }),
      }),
    ).rejects.toThrowError(/no converter/i)
  })
})
