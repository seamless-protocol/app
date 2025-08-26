import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { mintWithRouter } from '../../../src/domain/mint-with-router/mintWithRouter'

const router = '0x0000000000000000000000000000000000000011' as Address
const manager = '0x0000000000000000000000000000000000000012' as Address
const token = '0x0000000000000000000000000000000000000013' as Address
const user = '0x0000000000000000000000000000000000000014' as Address

describe('mintWithRouter (mocked)', () => {
  it('runs full flow and returns tx hash + preview', async () => {
    // weETH on Base (used to trigger EtherFi context path)
    const weETH = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address

    const reads: any = {
      getLeverageTokenCollateralAsset: vi.fn(async () => weETH),
      getLeverageTokenDebtAsset: vi.fn(async () => '0x00000000000000000000000000000000000000de'),
      previewMint: vi.fn(async () => ({ shares: 1000n, tokenFee: 0n, treasuryFee: 0n })),
      allowance: vi.fn(async () => 0n),
    }

    const publicClient: any = {
      readContract: vi.fn(async (_args: any) => {
        const fn = _args.functionName
        if (fn === 'getLeverageTokenCollateralAsset') return reads.getLeverageTokenCollateralAsset()
        if (fn === 'getLeverageTokenDebtAsset') return reads.getLeverageTokenDebtAsset()
        if (fn === 'previewMint') return reads.previewMint()
        if (fn === 'allowance') return reads.allowance()
        return 0n
      }),
      simulateContract: vi.fn(async () => ({
        request: { address: router, abi: [], functionName: 'mint' },
      })),
      waitForTransactionReceipt: vi.fn(async () => ({ status: 'success' })),
      getChainId: vi.fn(async () => 8453),
    }

    const walletClient: any = {
      writeContract: vi.fn(async () => `0x${'b'.repeat(64)}` as Address),
    }

    const res = await mintWithRouter(
      { publicClient, walletClient },
      { router, manager, token },
      user,
      { equityInCollateralAsset: 100n },
    )

    expect(res.hash).toMatch(/^0x[0-9a-fA-F]{64}$/)
    expect(res.preview.shares).toBe(1000n)
    expect(res.minShares).toBeGreaterThan(0n)
    expect(publicClient.simulateContract).toHaveBeenCalled()
    expect(walletClient.writeContract).toHaveBeenCalled()
  })
})
