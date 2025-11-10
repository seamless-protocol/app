import type { Address, Hash } from 'viem'
import { UserRejectedRequestError } from 'viem'
import { base } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { hookTestUtils, makeAddr, makeTxnHash, mockSetup } from '../../../../../utils.tsx'

// Mock the generated contract functions
vi.mock('@/lib/contracts/generated', () => ({
  simulateLeverageRouterV2Deposit: vi.fn(),
  writeLeverageRouterV2Deposit: vi.fn(),
}))

// Note: getContractAddresses is already mocked in tests/setup.ts
// Import mocked functions for type-safe mocking
import {
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'

const mockGetContractAddresses = vi.mocked(getContractAddresses)

describe('useMintWrite', () => {
  // Test addresses and values
  const MOCK_CONFIG = {} as Config
  const CHAIN_ID = base.id
  const TOKEN_ADDRESS: Address = makeAddr('token')
  const ACCOUNT_ADDRESS: Address = makeAddr('account')
  const MULTICALL_EXECUTOR: Address = makeAddr('executor')
  const MOCK_HASH: Hash = makeTxnHash('mint-transaction')

  const mockPlan = {
    inputAsset: makeAddr('input'),
    equityInInputAsset: 1000000000000000000n, // 1 token
    minShares: 900000000000000000n, // 0.9 tokens (10% slippage)
    calls: [
      {
        target: makeAddr('swap'),
        value: 0n,
        data: '0xabcdef1234567890' as `0x${string}`,
      },
    ],
    expectedTotalCollateral: 2000000000000000000n, // 2 tokens
    expectedDebt: 1000000000000000000n, // 1 token
    flashLoanAmount: 1000000000000000000n, // 1 token
  }

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(ACCOUNT_ADDRESS, CHAIN_ID)

    // Setup default getContractAddresses mock
    mockGetContractAddresses.mockReturnValue({
      multicallExecutor: MULTICALL_EXECUTOR,
    })
  })

  describe('Hook Initialization', () => {
    it('should initialize mutation hook successfully', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should initialize mutation hook without key parameter', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useMintWrite())

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('Successful Execution', () => {
    it('should execute mint mutation successfully and return transaction hash', async () => {
      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        MULTICALL_EXECUTOR,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      const hash = await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: mockPlan,
      })

      expect(hash).toBe(MOCK_HASH)
      expect(typeof hash).toBe('string')
      expect(hash.startsWith('0x')).toBe(true)
      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledTimes(1)
      expect(writeLeverageRouterV2Deposit).toHaveBeenCalledTimes(1)
    })

    it('should call simulate with correct parameters', async () => {
      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        MULTICALL_EXECUTOR,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: mockPlan,
      })

      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledTimes(1)
      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledWith(MOCK_CONFIG, {
        args: mockArgs,
        account: ACCOUNT_ADDRESS,
        chainId: CHAIN_ID,
      })
    })

    it('should call write with simulated request', async () => {
      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        MULTICALL_EXECUTOR,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: mockPlan,
      })

      expect(writeLeverageRouterV2Deposit).toHaveBeenCalledTimes(1)
      expect(writeLeverageRouterV2Deposit).toHaveBeenCalledWith(MOCK_CONFIG, mockSimulateRequest)
    })

    it('should use flashLoanAmount when provided', async () => {
      const planWithFlashLoan = {
        ...mockPlan,
        flashLoanAmount: 2000000000000000000n, // 2 tokens
        expectedDebt: 1500000000000000000n, // 1.5 tokens
      }
      const mockArgs = [
        TOKEN_ADDRESS,
        planWithFlashLoan.equityInInputAsset,
        planWithFlashLoan.flashLoanAmount, // Should use flashLoanAmount, not expectedDebt
        planWithFlashLoan.minShares,
        MULTICALL_EXECUTOR,
        planWithFlashLoan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: planWithFlashLoan,
        }),
      )

      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: planWithFlashLoan,
      })

      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([planWithFlashLoan.flashLoanAmount]),
        }),
      )
    })

    it('should use expectedDebt when flashLoanAmount is not provided', async () => {
      const planWithoutFlashLoan = {
        ...mockPlan,
        flashLoanAmount: undefined,
        expectedDebt: 1500000000000000000n, // 1.5 tokens
      } as any
      const mockArgs = [
        TOKEN_ADDRESS,
        planWithoutFlashLoan.equityInInputAsset,
        planWithoutFlashLoan.expectedDebt, // Should use expectedDebt as fallback
        planWithoutFlashLoan.minShares,
        MULTICALL_EXECUTOR,
        planWithoutFlashLoan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: planWithoutFlashLoan,
        }),
      )

      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: planWithoutFlashLoan,
      })

      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([planWithoutFlashLoan.expectedDebt]),
        }),
      )
    })
  })

  describe('Parameter Handling', () => {
    it('should handle different chainIds correctly', async () => {
      const MAINNET_CHAIN_ID = 1
      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        MULTICALL_EXECUTOR,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: MAINNET_CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: MAINNET_CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: mockPlan,
      })

      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          chainId: MAINNET_CHAIN_ID,
        }),
      )
    })

    it('should handle multiple calls in the calls array', async () => {
      const planWithMultipleCalls = {
        ...mockPlan,
        calls: [
          {
            target: makeAddr('swap1'),
            value: 0n,
            data: '0x111111' as `0x${string}`,
          },
          {
            target: makeAddr('swap2'),
            value: 1000000000000000n,
            data: '0x222222' as `0x${string}`,
          },
        ],
      }
      const mockArgs = [
        TOKEN_ADDRESS,
        planWithMultipleCalls.equityInInputAsset,
        planWithMultipleCalls.flashLoanAmount,
        planWithMultipleCalls.minShares,
        MULTICALL_EXECUTOR,
        planWithMultipleCalls.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: planWithMultipleCalls,
        }),
      )

      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: planWithMultipleCalls,
      })

      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([planWithMultipleCalls.calls]),
        }),
      )
    })

    it('should get multicallExecutor from getContractAddresses', async () => {
      const customExecutor = makeAddr('custom-executor')
      mockGetContractAddresses.mockReturnValue({
        multicallExecutor: customExecutor,
      })

      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        customExecutor,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: mockPlan,
      })

      expect(mockGetContractAddresses).toHaveBeenCalledWith(CHAIN_ID)
      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([customExecutor]),
        }),
      )
    })
  })

  describe('Error Handling', () => {
    it('should propagate simulation errors (including RPC failures and contract reverts)', async () => {
      // Test various simulation error scenarios
      const simulationError = new Error('Simulation failed: insufficient balance')
      vi.mocked(simulateLeverageRouterV2Deposit).mockRejectedValueOnce(simulationError)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await expect(
        result.current.mutateAsync({
          config: MOCK_CONFIG,
          chainId: CHAIN_ID,
          account: ACCOUNT_ADDRESS,
          token: TOKEN_ADDRESS,
          plan: mockPlan,
        }),
      ).rejects.toThrow('Simulation failed: insufficient balance')

      expect(writeLeverageRouterV2Deposit).not.toHaveBeenCalled()
    })

    it('should handle wallet rejection errors', async () => {
      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        MULTICALL_EXECUTOR,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)

      const userRejectedError = new UserRejectedRequestError(new Error('User rejected the request'))
      vi.mocked(writeLeverageRouterV2Deposit).mockRejectedValueOnce(userRejectedError)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await expect(
        result.current.mutateAsync({
          config: MOCK_CONFIG,
          chainId: CHAIN_ID,
          account: ACCOUNT_ADDRESS,
          token: TOKEN_ADDRESS,
          plan: mockPlan,
        }),
      ).rejects.toThrow(UserRejectedRequestError)
    })

    it('should handle RPC failure errors during write', async () => {
      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        MULTICALL_EXECUTOR,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)

      const rpcError = new Error('RPC error: network failure')
      vi.mocked(writeLeverageRouterV2Deposit).mockRejectedValueOnce(rpcError)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await expect(
        result.current.mutateAsync({
          config: MOCK_CONFIG,
          chainId: CHAIN_ID,
          account: ACCOUNT_ADDRESS,
          token: TOKEN_ADDRESS,
          plan: mockPlan,
        }),
      ).rejects.toThrow('RPC error: network failure')
    })

    it('should handle missing multicallExecutor config', async () => {
      mockGetContractAddresses.mockReturnValueOnce({
        leverageManagerV2: makeAddr('manager'),
      } as ReturnType<typeof getContractAddresses>)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      // The code casts undefined to Address, which will cause a runtime error
      // when passed to the contract call. This tests that edge case.
      await expect(
        result.current.mutateAsync({
          config: MOCK_CONFIG,
          chainId: CHAIN_ID,
          account: ACCOUNT_ADDRESS,
          token: TOKEN_ADDRESS,
          plan: mockPlan,
        }),
      ).rejects.toThrow()

      expect(mockGetContractAddresses).toHaveBeenCalledWith(CHAIN_ID)
    })

    it('should propagate transaction write errors', async () => {
      const mockArgs = [
        TOKEN_ADDRESS,
        mockPlan.equityInInputAsset,
        mockPlan.flashLoanAmount,
        mockPlan.minShares,
        MULTICALL_EXECUTOR,
        mockPlan.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)

      const writeError = new Error('Transaction failed: user rejected')
      vi.mocked(writeLeverageRouterV2Deposit).mockRejectedValueOnce(writeError)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: mockPlan,
        }),
      )

      await expect(
        result.current.mutateAsync({
          config: MOCK_CONFIG,
          chainId: CHAIN_ID,
          account: ACCOUNT_ADDRESS,
          token: TOKEN_ADDRESS,
          plan: mockPlan,
        }),
      ).rejects.toThrow('Transaction failed: user rejected')
    })
  })

  describe('Plan Signature Generation (makePlanSig coverage)', () => {
    it('should handle plan with undefined calls array', async () => {
      const planWithUndefinedCalls = {
        ...mockPlan,
        calls: undefined,
      } as any
      const mockArgs = [
        TOKEN_ADDRESS,
        planWithUndefinedCalls.equityInInputAsset,
        planWithUndefinedCalls.flashLoanAmount,
        planWithUndefinedCalls.minShares,
        MULTICALL_EXECUTOR,
        planWithUndefinedCalls.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: planWithUndefinedCalls,
        }),
      )

      // Should handle undefined calls gracefully in makePlanSig
      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: planWithUndefinedCalls,
      })

      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalled()
    })

    it('should handle plan with empty calls array', async () => {
      const planWithEmptyCalls = {
        ...mockPlan,
        calls: [],
      }
      const mockArgs = [
        TOKEN_ADDRESS,
        planWithEmptyCalls.equityInInputAsset,
        planWithEmptyCalls.flashLoanAmount,
        planWithEmptyCalls.minShares,
        MULTICALL_EXECUTOR,
        planWithEmptyCalls.calls,
      ]
      const mockSimulateRequest = { args: mockArgs }

      vi.mocked(simulateLeverageRouterV2Deposit).mockResolvedValueOnce({
        request: mockSimulateRequest,
      } as never)
      vi.mocked(writeLeverageRouterV2Deposit).mockResolvedValueOnce(MOCK_HASH)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintWrite({
          chainId: CHAIN_ID,
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          plan: planWithEmptyCalls,
        }),
      )

      // Should handle empty calls array in makePlanSig and execution
      await result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: planWithEmptyCalls,
      })

      expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledWith(
        MOCK_CONFIG,
        expect.objectContaining({
          args: expect.arrayContaining([[]]),
        }),
      )
    })
  })
})
