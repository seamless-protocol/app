import type { Address, Hash } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { createRouterPortV1 } from '@/domain/mint/ports'
import {
  readLeverageManagerPreviewMint,
  simulateLeverageRouterMint,
  writeLeverageRouterMint,
} from '@/lib/contracts/generated'

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageManagerPreviewMint: vi.fn(),
  simulateLeverageRouterMint: vi.fn(),
  writeLeverageRouterMint: vi.fn(),
}))

const DUMMY_CONFIG = {} as unknown as Config
const TOKEN = '0x0000000000000000000000000000000000000001' as Address
const ACCOUNT = '0x00000000000000000000000000000000000000bb' as Address

describe('RouterPort V1', () => {
  it('supportsUserConversion is false', () => {
    const port = createRouterPortV1({ config: DUMMY_CONFIG })
    expect(port.supportsUserConversion).toBe(false)
    expect(port.mode).toBe('v1')
  })

  it('previewDeposit proxies to manager.previewMint', async () => {
    ;(readLeverageManagerPreviewMint as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      collateral: 2000n,
      debt: 1000n,
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    const port = createRouterPortV1({ config: DUMMY_CONFIG })
    const res = await port.previewDeposit({ token: TOKEN, equityInCollateralAsset: 1000n })
    expect(res).toEqual({ collateral: 2000n, debt: 1000n, shares: 100n })
  })

  it('invokeMint simulates and writes mint with correct args', async () => {
    ;(simulateLeverageRouterMint as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      request: {
        args: [
          TOKEN,
          1000n,
          42n,
          5n,
          {
            path: [],
            encodedPath: '0x',
            fees: [0],
            tickSpacing: [0],
            exchange: 0,
            exchangeAddresses: {
              uniswapV2Router02: '0x0',
              uniswapSwapRouter02: '0x0',
              aerodromeRouter: '0x0',
              aerodromePoolFactory: '0x0',
              aerodromeSlipstreamRouter: '0x0',
            },
            additionalData: '0x',
          },
        ],
        account: ACCOUNT,
      },
    })
    ;(writeLeverageRouterMint as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      '0xhash' as Hash,
    )
    const port = createRouterPortV1({ config: DUMMY_CONFIG })
    const { hash } = await port.invokeMint({
      token: TOKEN,
      equityInCollateralAsset: 1000n,
      minShares: 42n,
      maxSwapCost: 5n,
      swapContext: {
        path: [],
        encodedPath: '0x',
        fees: [0],
        tickSpacing: [0],
        exchange: 0,
        exchangeAddresses: {
          aerodromePoolFactory: '0x0' as Address,
          aerodromeRouter: '0x0' as Address,
          aerodromeSlipstreamRouter: '0x0' as Address,
          uniswapSwapRouter02: '0x0' as Address,
          uniswapV2Router02: '0x0' as Address,
        },
        additionalData: '0x',
      },
      account: ACCOUNT,
    })
    expect(hash).toBe('0xhash')
    expect(simulateLeverageRouterMint).toHaveBeenCalled()
    expect(writeLeverageRouterMint).toHaveBeenCalled()
  })
})
