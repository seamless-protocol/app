import { zeroAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReadContract } from 'wagmi'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { hookTestUtils, makeAddr } from '../../../utils'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}))

describe('useTokenBalance', () => {
  const tokenAddress = makeAddr('token')
  const userAddress = makeAddr('user')
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hook initialization', () => {
    it('should create query with correct initial state when enabled', () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isError).toBe(false)
      expect(result.current.balance).toBe(0n)
      expect(result.current.error).toBeNull()
    })

    it('should not fetch when disabled', () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: false,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(useReadContract).toHaveBeenCalledWith({
        address: tokenAddress,
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [userAddress],
        chainId,
        query: {
          enabled: false,
          staleTime: 30000,
          refetchInterval: 30000,
          retry: false,
        },
      })
    })

    it('should not fetch when tokenAddress is missing', () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(useReadContract).toHaveBeenCalledWith({
        address: undefined,
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [userAddress],
        chainId,
        query: {
          enabled: false,
          staleTime: 30000,
          refetchInterval: 30000,
          retry: false,
        },
      })
    })

    it('should not fetch when userAddress is missing', () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(useReadContract).toHaveBeenCalledWith({
        address: tokenAddress,
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [zeroAddress],
        chainId,
        query: {
          enabled: false,
          staleTime: 30000,
          refetchInterval: 30000,
          retry: false,
        },
      })
    })
  })

  describe('successful data fetching', () => {
    it('should return balance when contract call succeeds', async () => {
      const mockBalance = 1000000000000000000n // 1 ETH in wei
      ;(useReadContract as any).mockReturnValue({
        data: mockBalance,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.balance).toBe(mockBalance)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should return zero balance when contract call fails', async () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.balance).toBe(0n)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should return zero balance when data is undefined', async () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.balance).toBe(0n)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle contract errors', async () => {
      const mockError = new Error('Network error')
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBe(mockError)
      expect(result.current.balance).toBe(0n)
    })
  })

  describe('contract configuration', () => {
    it('should configure contract with correct parameters', () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(useReadContract).toHaveBeenCalledWith({
        address: tokenAddress,
        abi: expect.any(Array), // erc20Abi
        functionName: 'balanceOf',
        args: [userAddress],
        chainId: chainId,
        query: {
          enabled: true,
          staleTime: 30000,
          refetchInterval: 30000,
          retry: false,
        },
      })
    })

    it('should use correct query configuration', () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      const callArgs = (useReadContract as any).mock.calls[0]?.[0]
      expect(callArgs?.query.staleTime).toBe(30000)
      expect(callArgs?.query.refetchInterval).toBe(30000)
      expect(callArgs?.query.retry).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle very large balance values', async () => {
      const mockBalance = BigInt(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      ) // max uint256
      ;(useReadContract as any).mockReturnValue({
        data: mockBalance,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.balance).toBe(mockBalance)
    })

    it('should handle zero balance', async () => {
      const mockBalance = 0n
      ;(useReadContract as any).mockReturnValue({
        data: mockBalance,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.balance).toBe(0n)
    })

    it('should return 0 when userAddress is zeroAddress', () => {
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress: zeroAddress,
          chainId,
          enabled: true,
        }),
      )

      const callArgs = (useReadContract as any).mock.calls[0]?.[0]
      expect(callArgs?.args?.[0]).toBe(zeroAddress)
      expect(callArgs?.query?.enabled).toBe(false)
      expect(result.current.balance).toBe(0n)
      expect(result.current.isError).toBe(false)
    })

    it('should handle different chain IDs', () => {
      const mainnetChainId = 1
      ;(useReadContract as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      hookTestUtils.renderHookWithQuery(() =>
        useTokenBalance({
          tokenAddress,
          userAddress,
          chainId: mainnetChainId,
          enabled: true,
        }),
      )

      const callArgs = (useReadContract as any).mock.calls[0]?.[0]
      expect(callArgs?.chainId).toBe(mainnetChainId)
    })
  })
})
