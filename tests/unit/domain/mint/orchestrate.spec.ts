import type { Address, Hash } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { orchestrateMint } from '@/domain/mint/orchestrate'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'

vi.mock('@/lib/contracts/generated', async () => ({
  // Minimal mocks to avoid accidental real reads
}))

// Mock execute flows and planner
vi.mock('@/domain/mint/exec/execute.v2', async () => ({
  executeMintV2: vi.fn(async () => ({ hash: '0xhash_v2' as Hash })),
}))
vi.mock('@/domain/mint/planner/plan.v2', async () => ({
  planMintV2: vi.fn(async () => ({
    inputAsset: '0x1' as Address,
    equityInInputAsset: 1n,
    collateralAsset: '0x2' as Address,
    debtAsset: '0x3' as Address,
    minShares: 1n,
    expectedShares: 1n,
    expectedDebt: 1n,
    expectedTotalCollateral: 2n,
    expectedExcessDebt: 0n,
    calls: [],
  })),
}))

describe('orchestrateMint', () => {
  const cfg = {} as any
  const account = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address
  const token = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address
  const inputAsset = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes V2 mint; requires quoteDebtToCollateral', async () => {
    const quoteDebtToCollateral = vi.fn(async () => ({
      out: 1n,
      approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
      calldata: '0x' as `0x${string}`,
    }))
    const res = await orchestrateMint({
      config: cfg,
      account,
      token,
      inputAsset,
      equityInInputAsset: 1000n,
      chainId: 8453,
      quoteDebtToCollateral,
      routerAddressV2: '0xrouter' as Address,
      managerAddressV2: '0xmanager' as Address,
    })
    expect(res.routerVersion).toBe('v2')
    expect(res.hash).toBe('0xhash_v2')
    expect(planMintV2).toHaveBeenCalledWith(expect.objectContaining({ quoteDebtToCollateral }))
  })
})
