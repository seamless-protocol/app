import { waitFor } from '@testing-library/react'
import type { Address, Hash } from 'viem'
import { UserRejectedRequestError } from 'viem'
import { base } from 'viem/chains'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { useChainId, usePublicClient, useSwitchChain } from 'wagmi'
import { useCollateralToDebtQuote } from '@/features/leverage-tokens/hooks/redeem/useCollateralToDebtQuote'
import { useRedeemExecution } from '@/features/leverage-tokens/hooks/redeem/useRedeemExecution'
import { useRedeemWithRouter } from '@/features/leverage-tokens/hooks/useRedeemWithRouter'
import { hookTestUtils, makeAddr, makeTxnHash, mockSetup } from '../../../../../utils.tsx'

// Mock dependencies
vi.mock('@/features/leverage-tokens/hooks/useRedeemWithRouter')
vi.mock('@/features/leverage-tokens/hooks/redeem/useCollateralToDebtQuote')

const mockUseRedeemWithRouter = useRedeemWithRouter as Mock
const mockUseCollateralToDebtQuote = useCollateralToDebtQuote as Mock
const mockUseSwitchChain = useSwitchChain as Mock
const mockUseChainId = useChainId as Mock
const mockUsePublicClient = usePublicClient as Mock

describe('useRedeemExecution', () => {
  const CHAIN_ID = base.id
  const TOKEN_ADDRESS: Address = makeAddr('token')
  const ACCOUNT_ADDRESS: Address = makeAddr('account')
  const ROUTER_ADDRESS: Address = makeAddr('router')
  const MANAGER_ADDRESS: Address = makeAddr('manager')
  const MOCK_HASH: Hash = makeTxnHash('redeem-transaction')

  const mockPlan = {
    collateralToSwap: 1_000_000_000_000_000_000n,
    collateralToDebtQuoteAmount: 1_000_000_000_000_000_000n,
    sharesToRedeem: 1_000_000_000_000_000_000n, // 1 token
    minCollateralForSender: 900_000_000_000_000_000n, // 0.9 tokens
    minExcessDebt: 0n,
    previewCollateralForSender: 950_000_000_000_000_000n,
    previewExcessDebt: 0n,
    calls: [{ target: makeAddr('swap'), value: 0n, data: '0xabcdef1234567890' as `0x${string}` }],
    quoteSourceName: 'Mock Source',
    quoteSourceId: 'mock-source-id',
    routerMethod: 'redeem' as const,
  }

  const mockSwap = {
    type: 'uniswapV3' as const,
    poolKey: 'weeth-weth' as const,
  }

  const mockQuote = vi.fn()

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(ACCOUNT_ADDRESS, CHAIN_ID)

    // Setup default mocks
    mockUseChainId.mockReturnValue(CHAIN_ID)
    mockUseSwitchChain.mockReturnValue({
      switchChainAsync: vi.fn().mockResolvedValue(undefined),
    })
    mockUsePublicClient.mockReturnValue({
      waitForTransactionReceipt: vi.fn().mockResolvedValue({
        status: 'success',
        transactionHash: MOCK_HASH,
      }),
    })

    mockUseCollateralToDebtQuote.mockReturnValue({
      quote: mockQuote,
      status: 'ready' as const,
      error: undefined,
    })

    mockUseRedeemWithRouter.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        hash: MOCK_HASH,
        plan: mockPlan,
      }),
      isPending: false,
      error: undefined,
    })
  })

  describe('Hook Initialization', () => {
    it('should initialize hook successfully', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          managerAddress: MANAGER_ADDRESS,
          swap: mockSwap,
        }),
      )

      expect(result.current.redeem).toBeDefined()
      expect(result.current.status).toBe('idle')
      expect(result.current.hash).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(result.current.canSubmit).toBe(true)
      expect(result.current.quoteStatus).toBe('ready')
    })
  })

  describe('canSubmit Logic', () => {
    it('should return false when account is missing', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      expect(result.current.canSubmit).toBe(false)
    })

    it('should return false when quote is not ready', () => {
      mockUseCollateralToDebtQuote.mockReturnValue({
        quote: undefined,
        status: 'missing-config' as const,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      expect(result.current.canSubmit).toBe(false)
    })

    it('should return true when quote status is not-required', () => {
      mockUseCollateralToDebtQuote.mockReturnValue({
        quote: undefined,
        status: 'not-required' as const,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      expect(result.current.canSubmit).toBe(true)
    })
  })

  describe('Successful Execution', () => {
    it('should execute redeem successfully without chain switch', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        hash: MOCK_HASH,
        plan: mockPlan,
      })
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          managerAddress: MANAGER_ADDRESS,
          swap: mockSwap,
        }),
      )

      const receipt = await result.current.redeem(mockPlan)

      expect(mockMutateAsync).toHaveBeenCalledWith({
        token: TOKEN_ADDRESS,
        account: ACCOUNT_ADDRESS,
        plan: mockPlan,
        chainId: CHAIN_ID,
        routerAddress: ROUTER_ADDRESS,
        managerAddress: MANAGER_ADDRESS,
      })

      expect(receipt.hash).toBe(MOCK_HASH)
      expect(receipt.plan).toBe(mockPlan)

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(result.current.hash).toBe(MOCK_HASH)
    })

    it('should execute redeem successfully with chain switch', async () => {
      const differentChainId = 1
      mockUseChainId.mockReturnValue(differentChainId)
      const mockSwitchChainAsync = vi.fn().mockResolvedValue(undefined)
      mockUseSwitchChain.mockReturnValue({
        switchChainAsync: mockSwitchChainAsync,
      })

      const mockMutateAsync = vi.fn().mockResolvedValue({
        hash: MOCK_HASH,
        plan: mockPlan,
      })
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      await result.current.redeem(mockPlan)

      expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: CHAIN_ID })
      expect(mockMutateAsync).toHaveBeenCalled()

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(result.current.hash).toBe(MOCK_HASH)
    })

    it('should omit optional parameters when not provided', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        hash: MOCK_HASH,
        plan: mockPlan,
      })
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
        }),
      )

      await result.current.redeem(mockPlan)

      expect(mockMutateAsync).toHaveBeenCalledWith({
        token: TOKEN_ADDRESS,
        account: ACCOUNT_ADDRESS,
        plan: mockPlan,
        chainId: CHAIN_ID,
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw error when account is missing', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      await expect(result.current.redeem(mockPlan)).rejects.toThrow('No account')

      // When account is missing, error is thrown immediately without setting state
      // So status remains 'idle' and error remains undefined
      expect(result.current.status).toBe('idle')
      expect(result.current.error).toBeUndefined()
    })

    it('should handle wallet rejection error', async () => {
      const mockError = new UserRejectedRequestError(new Error('User rejected'))
      const mockMutateAsync = vi.fn().mockRejectedValue(mockError)
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      await expect(result.current.redeem(mockPlan)).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(result.current.error).toBe(mockError)
    })

    it('should handle chain switch failure', async () => {
      const differentChainId = 1
      mockUseChainId.mockReturnValue(differentChainId)
      const mockSwitchError = new Error('Failed to switch chain')
      const mockSwitchChainAsync = vi.fn().mockRejectedValue(mockSwitchError)
      mockUseSwitchChain.mockReturnValue({
        switchChainAsync: mockSwitchChainAsync,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      await expect(result.current.redeem(mockPlan)).rejects.toThrow('Failed to switch chain')

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(result.current.error?.message).toBe('Failed to switch chain')
    })

    it('should handle transaction revert', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        hash: MOCK_HASH,
        plan: mockPlan,
      })
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      mockUsePublicClient.mockReturnValue({
        waitForTransactionReceipt: vi.fn().mockResolvedValue({
          status: 'reverted',
          transactionHash: MOCK_HASH,
        }),
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      await expect(result.current.redeem(mockPlan)).rejects.toThrow('Transaction reverted')

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(result.current.error?.message).toBe('Transaction reverted')
    })

    it('should handle RPC failure', async () => {
      const mockError = new Error('RPC error')
      const mockMutateAsync = vi.fn().mockRejectedValue(mockError)
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      await expect(result.current.redeem(mockPlan)).rejects.toThrow('RPC error')

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(result.current.error).toBe(mockError)
    })

    it('should handle non-Error exceptions', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue('String error')
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      await expect(result.current.redeem(mockPlan)).rejects.toThrow()

      await waitFor(() => {
        expect(result.current.status).toBe('error')
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('String error')
    })

    it('should handle missing public client for receipt wait', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({
        hash: MOCK_HASH,
        plan: mockPlan,
      })
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: undefined,
      })

      mockUsePublicClient.mockReturnValue(null)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      // Should still succeed even without public client (receipt wait is optional)
      await result.current.redeem(mockPlan)

      await waitFor(() => {
        expect(result.current.status).toBe('success')
      })

      expect(result.current.hash).toBe(MOCK_HASH)
    })
  })

  describe('Status Management', () => {
    it('should show submitting status when mutation is pending', () => {
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
        error: undefined,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      expect(result.current.status).toBe('submitting')
    })

    it('should propagate quote error', () => {
      const mockQuoteError = new Error('Quote error')
      mockUseCollateralToDebtQuote.mockReturnValue({
        quote: undefined,
        status: 'error' as const,
        error: mockQuoteError,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      expect(result.current.quoteError).toBe(mockQuoteError)
      // error field only shows mutation error or local error, not quote error
      expect(result.current.error).toBeUndefined()
    })

    it('should propagate mutation error', () => {
      const mockMutationError = new Error('Mutation error')
      mockUseRedeemWithRouter.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        error: mockMutationError,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemExecution({
          token: TOKEN_ADDRESS,
          account: ACCOUNT_ADDRESS,
          chainId: CHAIN_ID,
          routerAddress: ROUTER_ADDRESS,
          swap: mockSwap,
        }),
      )

      expect(result.current.error).toBe(mockMutationError)
    })
  })
})
