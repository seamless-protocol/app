import type { Address, Hash, Hex } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'

vi.mock('@/domain/redeem/exec/execute', () => ({
  executeRedeem: vi.fn(),
}))

vi.mock('@/lib/contracts/addresses', () => ({
  getContractAddresses: vi.fn(),
  contractAddresses: {},
}))

import { executeRedeem } from '@/domain/redeem/exec/execute'
import { orchestrateRedeem } from '@/domain/redeem/orchestrate'
import type { RedeemPlan } from '@/domain/redeem/planner/plan'
import { getContractAddresses } from '@/lib/contracts/addresses'

const MOCK_CONFIG = {} as Config
const TOKEN: Address = '0x1111111111111111111111111111111111111111'
const ACCOUNT: Address = '0x2222222222222222222222222222222222222222'
const ROUTER_V2: Address = '0x3333333333333333333333333333333333333333'
const MULTICALL_EXECUTOR: Address = '0x6666666666666666666666666666666666666666'
const MOCK_HASH: Hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

const mockPlan: RedeemPlan = {
  collateralToSwap: 1_000n,
  collateralToDebtQuoteAmount: 1_000n,
  sharesToRedeem: 1_000n,
  minCollateralForSender: 900n,
  minExcessDebt: 0n,
  previewCollateralForSender: 950n,
  previewExcessDebt: 25n,
  calls: [
    {
      target: '0xaaaa000000000000000000000000000000000000' as Address,
      data: '0x01' as Hex,
      value: 0n,
    },
  ],
  quoteSourceName: 'Mock Source',
  quoteSourceId: 'mock-source-id',
}

describe('orchestrateRedeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getContractAddresses).mockReturnValue({
      leverageRouterV2: ROUTER_V2,
      multicallExecutor: MULTICALL_EXECUTOR,
    } as any)
    vi.mocked(executeRedeem).mockResolvedValue({ hash: MOCK_HASH } as any)
  })

  it('executes redeem with resolved addresses', async () => {
    const result = await orchestrateRedeem({
      config: MOCK_CONFIG,
      account: ACCOUNT,
      token: TOKEN,
      plan: mockPlan,
      chainId: 8453,
    })

    expect(result.hash).toBe(MOCK_HASH)
    expect(executeRedeem).toHaveBeenCalledWith({
      config: MOCK_CONFIG,
      token: TOKEN,
      account: ACCOUNT,
      sharesToRedeem: mockPlan.sharesToRedeem,
      minCollateralForSender: mockPlan.minCollateralForSender,
      multicallExecutor: MULTICALL_EXECUTOR,
      swapCalls: mockPlan.calls,
      routerAddress: ROUTER_V2,
      chainId: 8453,
    })
  })

  it('throws if router missing', async () => {
    vi.mocked(getContractAddresses).mockReturnValue({} as any)

    await expect(
      orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockPlan,
        chainId: 8453,
      }),
    ).rejects.toThrow(/LeverageRouterV2 address required/)
  })
})
