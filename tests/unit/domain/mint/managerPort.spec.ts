import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { createManagerPortV2 } from '@/domain/mint/ports'
import { readLeverageRouterV2PreviewDeposit } from '@/lib/contracts/generated'

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageRouterV2PreviewDeposit: vi.fn(),
}))

const DUMMY_CONFIG = {} as unknown as Config
const TOKEN = '0x0000000000000000000000000000000000000001' as Address

describe('ManagerPort V2', () => {
  it('idealPreview uses router.previewDeposit when routerAddress provided', async () => {
    ;(readLeverageRouterV2PreviewDeposit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      collateral: 2000n,
      debt: 1000n,
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    const port = createManagerPortV2({ config: DUMMY_CONFIG, routerAddress: '0xrouter' as Address })
    const res = await port.idealPreview({ token: TOKEN, userCollateral: 1000n, chainId: 1 })
    expect(res).toEqual({ targetCollateral: 2000n, idealDebt: 1000n, idealShares: 100n })
  })

  it('finalPreview uses router.previewDeposit', async () => {
    ;(readLeverageRouterV2PreviewDeposit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      collateral: 0n,
      debt: 999n,
      shares: 55n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    const port = createManagerPortV2({ config: DUMMY_CONFIG, routerAddress: '0xrouter' as Address })
    const res = await port.finalPreview({ token: TOKEN, userCollateral: 1994n, chainId: 1 })
    expect(res).toEqual({ previewDebt: 999n, previewShares: 55n })
  })
})
