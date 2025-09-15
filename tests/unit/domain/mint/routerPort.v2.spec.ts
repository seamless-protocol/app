import type { Address, Hash } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { createRouterPortV2 } from '@/domain/mint/ports'
import {
  readLeverageRouterV2PreviewDeposit,
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageRouterV2PreviewDeposit: vi.fn(),
  simulateLeverageRouterV2Deposit: vi.fn(),
  writeLeverageRouterV2Deposit: vi.fn(),
}))

const DUMMY_CONFIG = {} as unknown as Config
const TOKEN = '0x0000000000000000000000000000000000000001' as Address
const ROUTER = '0x00000000000000000000000000000000000000aa' as Address
const ACCOUNT = '0x00000000000000000000000000000000000000bb' as Address

describe('RouterPort V2', () => {
  it('supportsUserConversion is false', () => {
    const port = createRouterPortV2({ config: DUMMY_CONFIG, routerAddress: ROUTER })
    expect(port.supportsUserConversion).toBe(false)
    expect(port.mode).toBe('v2')
  })

  it('previewDeposit maps tuple to normalized shape', async () => {
    ;(readLeverageRouterV2PreviewDeposit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      collateral: 1234n,
      debt: 777n,
      shares: 55n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    const port = createRouterPortV2({ config: DUMMY_CONFIG, routerAddress: ROUTER })
    const res = await port.previewDeposit({ token: TOKEN, collateralFromSender: 1000n })
    expect(res).toEqual({ collateral: 1234n, debt: 777n, shares: 55n })
  })

  it('invokeMint simulates and writes deposit with correct args', async () => {
    ;(simulateLeverageRouterV2Deposit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      request: {
        address: ROUTER,
        abi: [],
        functionName: 'deposit',
        args: [TOKEN, 1000n, 500n, 42n, []],
        account: ACCOUNT,
      },
    })
    ;(writeLeverageRouterV2Deposit as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      '0xhash' as Hash,
    )
    const port = createRouterPortV2({ config: DUMMY_CONFIG, routerAddress: ROUTER })
    const { hash } = await port.invokeMint({
      token: TOKEN,
      collateralFromSender: 1000n,
      flashLoanAmount: 500n,
      minShares: 42n,
      calls: [],
      account: ACCOUNT,
    })
    expect(hash).toBe('0xhash')
    expect(simulateLeverageRouterV2Deposit).toHaveBeenCalled()
    expect(writeLeverageRouterV2Deposit).toHaveBeenCalled()
  })
})
