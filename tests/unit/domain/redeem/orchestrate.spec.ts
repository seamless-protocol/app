/**
 * Unit tests for orchestrateRedeem
 *
 * Tests the orchestration layer that routes between Velora and standard V2 execution
 * based on adapter configuration and quote type.
 */

import type { Address, Hash, Hex } from 'viem'
import { base } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'

// Mock all dependencies
vi.mock('@/domain/redeem/exec/execute', () => ({
  executeRedeem: vi.fn(),
}))

vi.mock('@/domain/redeem/exec/execute.velora', () => ({
  executeRedeemWithVelora: vi.fn(),
}))

vi.mock('@/domain/redeem/planner/plan', () => ({
  planRedeem: vi.fn(),
}))

vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getLeverageTokenConfig: vi.fn(),
}))

vi.mock('@/lib/contracts/addresses', () => ({
  getContractAddresses: vi.fn(),
}))

// Import mocked functions
import { executeRedeem } from '@/domain/redeem/exec/execute'
import { executeRedeemWithVelora } from '@/domain/redeem/exec/execute.velora'
import { getQuoteIntentForAdapter, orchestrateRedeem } from '@/domain/redeem/orchestrate'
import type { RedeemPlan } from '@/domain/redeem/planner/plan'
import type { VeloraQuote } from '@/domain/shared/adapters/types'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getContractAddresses } from '@/lib/contracts/addresses'

describe('orchestrateRedeem', () => {
  // Test constants
  const MOCK_CONFIG = {} as Config
  const TOKEN: Address = '0x1111111111111111111111111111111111111111'
  const ACCOUNT: Address = '0x2222222222222222222222222222222222222222'
  const ROUTER_V2: Address = '0x3333333333333333333333333333333333333333'
  const MANAGER_V2: Address = '0x4444444444444444444444444444444444444444'
  const VELORA_ADAPTER: Address = '0x5555555555555555555555555555555555555555'
  const MULTICALL_EXECUTOR: Address = '0x6666666666666666666666666666666666666666'
  const AUGUSTUS: Address = '0x7777777777777777777777777777777777777777'
  const SHARES_TO_REDEEM = 1000000000000000000n
  const MOCK_HASH: Hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

  const mockStandardQuote = {
    out: 50000000n,
    minOut: 49000000n,
    maxIn: 100000000000000000n,
    approvalTarget: '0x8888888888888888888888888888888888888888' as Address,
    calls: [
      {
        target: '0x8888888888888888888888888888888888888888' as Address,
        data: '0x1234' as Hex,
        value: 0n,
      },
    ],
  }

  const mockVeloraQuote: VeloraQuote = {
    ...mockStandardQuote,
    veloraData: {
      augustus: AUGUSTUS,
      offsets: {
        exactAmount: 132n,
        limitAmount: 100n,
        quotedAmount: 164n,
      },
    },
  }

  const mockPlan: RedeemPlan = {
    token: TOKEN,
    sharesToRedeem: SHARES_TO_REDEEM,
    collateralAsset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
    debtAsset: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address,
    slippageBps: 50,
    minCollateralForSender: 900000000000000000n,
    expectedCollateral: 950000000000000000n,
    expectedDebt: 50000000n,
    collateralToDebtQuote: mockStandardQuote,
    expectedTotalCollateral: 1000000000000000000n,
    expectedExcessCollateral: 50000000000000000n,
    expectedDebtPayout: 0n,
    payoutAsset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
    payoutAmount: 950000000000000000n,
    calls: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(getContractAddresses).mockReturnValue({
      leverageRouterV2: ROUTER_V2,
      leverageManagerV2: MANAGER_V2,
      veloraAdapter: VELORA_ADAPTER,
      multicallExecutor: MULTICALL_EXECUTOR,
    } as any)
  })

  describe('Velora Execution Path', () => {
    const mockVeloraPlan: RedeemPlan = {
      ...mockPlan,
      collateralToDebtQuote: mockVeloraQuote,
    }

    beforeEach(() => {
      vi.mocked(getLeverageTokenConfig).mockReturnValue({
        swaps: {
          collateralToDebt: {
            type: 'velora',
          },
        },
      } as any)

      vi.mocked(executeRedeemWithVelora).mockResolvedValue({ hash: MOCK_HASH })
    })

    it('should orchestrate redeem with Velora adapter', async () => {
      const result = await orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockVeloraPlan,
        chainId: base.id,
      })

      expect(result.hash).toBe(MOCK_HASH)
      expect(result.plan.collateralToDebtQuote).toEqual(mockVeloraQuote)
      expect(executeRedeemWithVelora).toHaveBeenCalledTimes(1)
      expect(executeRedeem).not.toHaveBeenCalled()
    })

    it('should pass veloraData to executeRedeemWithVelora', async () => {
      await orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockVeloraPlan,
        chainId: base.id,
      })

      expect(executeRedeemWithVelora).toHaveBeenCalledWith({
        config: MOCK_CONFIG,
        token: TOKEN,
        account: ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: mockPlan.minCollateralForSender,
        veloraAdapter: VELORA_ADAPTER,
        augustus: AUGUSTUS,
        offsets: {
          exactAmount: 132n,
          limitAmount: 100n,
          quotedAmount: 164n,
        },
        swapData: mockVeloraQuote.calldata,
        routerAddress: ROUTER_V2,
        chainId: base.id,
      })
    })

    it('should throw if Velora adapter address missing', async () => {
      vi.mocked(getContractAddresses).mockReturnValue({
        leverageRouterV2: ROUTER_V2,
        leverageManagerV2: MANAGER_V2,
        multicallExecutor: MULTICALL_EXECUTOR,
        // veloraAdapter missing
      } as any)

      await expect(
        orchestrateRedeem({
          config: MOCK_CONFIG,
          account: ACCOUNT,
          token: TOKEN,
          plan: mockVeloraPlan,
          chainId: base.id,
        }),
      ).rejects.toThrow(`Velora adapter address required on chain ${base.id}`)
    })

    it('should throw if Velora quote missing veloraData', async () => {
      // Pass plan with standard quote (no veloraData)
      await expect(
        orchestrateRedeem({
          config: MOCK_CONFIG,
          account: ACCOUNT,
          token: TOKEN,
          plan: mockPlan, // mockPlan has standard quote without veloraData
          chainId: base.id,
        }),
      ).rejects.toThrow('Velora quote missing veloraData for exactOut operation')
    })
  })

  describe('Standard V2 Execution Path', () => {
    beforeEach(() => {
      vi.mocked(executeRedeem).mockResolvedValue({ hash: MOCK_HASH })
    })

    it('should orchestrate redeem with lifi adapter', async () => {
      vi.mocked(getLeverageTokenConfig).mockReturnValue({
        swaps: {
          collateralToDebt: {
            type: 'lifi',
          },
        },
      } as any)

      const result = await orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockPlan,
        chainId: base.id,
      })

      expect(result.hash).toBe(MOCK_HASH)
      expect(executeRedeem).toHaveBeenCalledTimes(1)
      expect(executeRedeemWithVelora).not.toHaveBeenCalled()
    })

    it('should orchestrate redeem with uniswapV3 adapter', async () => {
      vi.mocked(getLeverageTokenConfig).mockReturnValue({
        swaps: {
          collateralToDebt: {
            type: 'uniswapV3',
          },
        },
      } as any)

      const result = await orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockPlan,
        chainId: base.id,
      })

      expect(result.hash).toBe(MOCK_HASH)
      expect(executeRedeem).toHaveBeenCalledTimes(1)
      expect(executeRedeemWithVelora).not.toHaveBeenCalled()
    })

    it('should pass correct parameters to executeRedeem', async () => {
      vi.mocked(getLeverageTokenConfig).mockReturnValue({
        swaps: {
          collateralToDebt: {
            type: 'lifi',
          },
        },
      } as any)

      await orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockPlan,
        chainId: base.id,
      })

      expect(executeRedeem).toHaveBeenCalledWith({
        config: MOCK_CONFIG,
        token: TOKEN,
        account: ACCOUNT,
        sharesToRedeem: SHARES_TO_REDEEM,
        minCollateralForSender: mockPlan.minCollateralForSender,
        multicallExecutor: MULTICALL_EXECUTOR,
        swapCalls: mockPlan.calls,
        routerAddress: ROUTER_V2,
        chainId: base.id,
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getLeverageTokenConfig).mockReturnValue({
        swaps: {
          collateralToDebt: {
            type: 'lifi',
          },
        },
      } as any)
    })

    it('should throw if router address missing', async () => {
      vi.mocked(getContractAddresses).mockReturnValue({
        leverageManagerV2: MANAGER_V2,
        multicallExecutor: MULTICALL_EXECUTOR,
        // leverageRouterV2 missing
      } as any)

      await expect(
        orchestrateRedeem({
          config: MOCK_CONFIG,
          account: ACCOUNT,
          token: TOKEN,
          plan: mockPlan,
          chainId: base.id,
        }),
      ).rejects.toThrow(`LeverageRouterV2 address required on chain ${base.id}`)
    })
  })

  describe('Configuration Overrides', () => {
    beforeEach(() => {
      vi.mocked(getLeverageTokenConfig).mockReturnValue({
        swaps: {
          collateralToDebt: {
            type: 'lifi',
          },
        },
      } as any)
      vi.mocked(executeRedeem).mockResolvedValue({ hash: MOCK_HASH })
    })

    it('should use explicit router address override', async () => {
      const CUSTOM_ROUTER: Address = '0x9999999999999999999999999999999999999999'

      await orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockPlan,
        routerAddress: CUSTOM_ROUTER,
        chainId: base.id,
      })

      expect(executeRedeem).toHaveBeenCalledWith(
        expect.objectContaining({
          routerAddress: CUSTOM_ROUTER,
        }),
      )
    })
  })

  describe('Default Adapter Fallback', () => {
    const mockVeloraPlan: RedeemPlan = {
      ...mockPlan,
      collateralToDebtQuote: mockVeloraQuote,
    }

    it('should default to velora when adapter type not configured', async () => {
      vi.mocked(getLeverageTokenConfig).mockReturnValue(undefined)
      vi.mocked(executeRedeemWithVelora).mockResolvedValue({ hash: MOCK_HASH })

      await orchestrateRedeem({
        config: MOCK_CONFIG,
        account: ACCOUNT,
        token: TOKEN,
        plan: mockVeloraPlan,
        chainId: base.id,
      })

      // Should use Velora path
      expect(executeRedeemWithVelora).toHaveBeenCalledTimes(1)
      expect(executeRedeem).not.toHaveBeenCalled()
    })
  })
})

describe('getQuoteIntentForAdapter', () => {
  it('should return exactOut for velora adapter', () => {
    expect(getQuoteIntentForAdapter('velora')).toBe('exactOut')
  })

  it('should return exactIn for lifi adapter', () => {
    expect(getQuoteIntentForAdapter('lifi')).toBe('exactIn')
  })

  it('should return exactIn for uniswapV3 adapter', () => {
    expect(getQuoteIntentForAdapter('uniswapV3')).toBe('exactIn')
  })

  it('should return exactIn for uniswapV2 adapter', () => {
    expect(getQuoteIntentForAdapter('uniswapV2')).toBe('exactIn')
  })
})
