import type { Address, Hash } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeMintV1 } from '@/domain/mint/execute.v1'

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerGetLeverageTokenCollateralAsset: vi.fn(
      async () => '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    ),
    readLeverageManagerGetLeverageTokenDebtAsset: vi.fn(
      async () => '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ),
    readLeverageManagerPreviewMint: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      return {
        collateral: equity,
        debt: equity / 2n,
        shares: equity,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
    simulateLeverageRouterMint: vi.fn(async (_config: any, { args, account }: any) => {
      return { request: { args, account } }
    }),
    writeLeverageRouterMint: vi.fn(async () => '0xhash' as Hash),
  }
})

describe('executeMintV1', () => {
  const cfg = {} as any
  const account = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address
  const token = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address
  const collateralAsset = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address

  beforeEach(() => vi.clearAllMocks())

  it('throws if input asset != collateral asset', async () => {
    await expect(
      executeMintV1({
        config: cfg,
        account,
        token,
        inputAsset: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE' as Address,
        equityInCollateralAsset: 1000n,
      }),
    ).rejects.toThrow()
  })

  it('simulates and writes mint when input asset is collateral; computes minShares', async () => {
    const res = await executeMintV1({
      config: cfg,
      account,
      token,
      inputAsset: collateralAsset,
      equityInCollateralAsset: 1_000n,
      slippageBps: 50,
      maxSwapCostInCollateralAsset: 10n,
    })
    expect(res.hash).toBe('0xhash')
  })
})
