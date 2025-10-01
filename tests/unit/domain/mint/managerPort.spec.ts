import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { createManagerPortV1, createManagerPortV2 } from '@/domain/mint/ports'
import {
  readLeverageManagerPreviewMint,
  readLeverageManagerV2PreviewDeposit,
  readLeverageRouterV2PreviewDeposit,
} from '@/lib/contracts/generated'

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageRouterV2PreviewDeposit: vi.fn(),
  readLeverageManagerV2PreviewDeposit: vi.fn(),
  readLeverageManagerV2PreviewMint: vi.fn(),
  readLeverageManagerPreviewMint: vi.fn(),
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

  it('finalPreview uses manager.previewDeposit', async () => {
    ;(readLeverageManagerV2PreviewDeposit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      {
        collateral: 0n,
        debt: 999n,
        shares: 55n,
        tokenFee: 0n,
        treasuryFee: 0n,
      },
    )
    const port = createManagerPortV2({
      config: DUMMY_CONFIG,
      managerAddress: '0xmanager' as Address,
    })
    const res = await port.finalPreview({ token: TOKEN, totalCollateral: 1994n, chainId: 1 })
    expect(res).toEqual({ previewDebt: 999n, previewShares: 55n })
  })
})

describe('ManagerPort V1', () => {
  it('idealPreview and finalPreview use manager.previewMint', async () => {
    ;(readLeverageManagerPreviewMint as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      collateral: 2000n,
      debt: 1000n,
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    const port = createManagerPortV1({
      config: DUMMY_CONFIG,
      managerAddress: '0xmanager' as Address,
    })
    const ideal = await port.idealPreview({ token: TOKEN, userCollateral: 1000n, chainId: 1 })
    expect(ideal).toEqual({ targetCollateral: 2000n, idealDebt: 1000n, idealShares: 100n })
    const final = await port.finalPreview({ token: TOKEN, totalCollateral: 1994n, chainId: 1 })
    expect(final).toEqual({ previewDebt: 1000n, previewShares: 100n })
  })
})
