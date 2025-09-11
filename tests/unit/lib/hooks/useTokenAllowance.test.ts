import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReadContracts } from 'wagmi'
import { useTokenAllowance } from '@/lib/hooks/useTokenAllowance'
import { hookTestUtils, makeAddr } from '../../../utils'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(),
}))

describe('useTokenAllowance', () => {
  const tokenAddress = makeAddr('token')
  const ownerAddress = makeAddr('owner')
  const spenderAddress = makeAddr('spender')
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hook initialization', () => {
    it('should create query with correct initial state when enabled', () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isError).toBe(false)
      expect(result.current.allowance).toBe(0n)
      expect(result.current.error).toBeNull()
    })

    it('should not fetch when disabled', () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: false,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(useReadContracts).toHaveBeenCalledWith({
        contracts: [],
        query: {
          enabled: false,
          staleTime: 30000,
          refetchInterval: 30000,
        },
      })
    })

    it('should not fetch when tokenAddress is missing', () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(useReadContracts).toHaveBeenCalledWith({
        contracts: [],
        query: {
          enabled: false,
          staleTime: 30000,
          refetchInterval: 30000,
        },
      })
    })

    it('should not fetch when owner is missing', () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(useReadContracts).toHaveBeenCalledWith({
        contracts: [],
        query: {
          enabled: false,
          staleTime: 30000,
          refetchInterval: 30000,
        },
      })
    })

    it('should not fetch when spender is missing', () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(useReadContracts).toHaveBeenCalledWith({
        contracts: [],
        query: {
          enabled: false,
          staleTime: 30000,
          refetchInterval: 30000,
        },
      })
    })
  })

  describe('successful data fetching', () => {
    it('should return allowance when contract call succeeds', async () => {
      const mockAllowance = 500000000000000000000n // 500 ETH in wei
      const mockContractData = [
        {
          status: 'success' as const,
          result: mockAllowance,
        },
      ]

      ;(useReadContracts as any).mockReturnValue({
        data: mockContractData,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.allowance).toBe(mockAllowance)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should return zero allowance when contract call fails', async () => {
      const mockContractData = [
        {
          status: 'failure' as const,
          error: new Error('Contract call failed'),
        },
      ]

      ;(useReadContracts as any).mockReturnValue({
        data: mockContractData,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.allowance).toBe(0n)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should return zero allowance when data is undefined', async () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.allowance).toBe(0n)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isError).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle contract errors', async () => {
      const mockError = new Error('Network error')
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: mockError,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBe(mockError)
      expect(result.current.allowance).toBe(0n)
    })
  })

  describe('contract configuration', () => {
    it('should configure contract with correct parameters', () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(useReadContracts).toHaveBeenCalledWith({
        contracts: [
          {
            address: tokenAddress,
            abi: expect.any(Array), // leverageTokenAbi
            functionName: 'allowance',
            args: [ownerAddress, spenderAddress],
            chainId: chainId,
          },
        ],
        query: {
          enabled: true,
          staleTime: 30000,
          refetchInterval: 30000,
        },
      })
    })

    it('should use correct query configuration', () => {
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      const callArgs = (useReadContracts as any).mock.calls[0]?.[0]
      expect(callArgs.query.staleTime).toBe(30000)
      expect(callArgs.query.refetchInterval).toBe(30000)
    })
  })

  describe('edge cases', () => {
    it('should handle max allowance (max uint256)', async () => {
      const mockAllowance = BigInt(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
      ) // max uint256
      const mockContractData = [
        {
          status: 'success' as const,
          result: mockAllowance,
        },
      ]

      ;(useReadContracts as any).mockReturnValue({
        data: mockContractData,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.allowance).toBe(mockAllowance)
    })

    it('should handle zero allowance', async () => {
      const mockAllowance = 0n
      const mockContractData = [
        {
          status: 'success' as const,
          result: mockAllowance,
        },
      ]

      ;(useReadContracts as any).mockReturnValue({
        data: mockContractData,
        isLoading: false,
        isError: false,
        error: null,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId,
          enabled: true,
        }),
      )

      expect(result.current.allowance).toBe(0n)
    })

    it('should handle different chain IDs', () => {
      const mainnetChainId = 1
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: ownerAddress,
          spender: spenderAddress,
          chainId: mainnetChainId,
          enabled: true,
        }),
      )

      const callArgs = (useReadContracts as any).mock.calls[0]?.[0]
      expect(callArgs.contracts[0].chainId).toBe(mainnetChainId)
    })

    it('should handle same owner and spender addresses', () => {
      const sameAddress = '0x1234567890123456789012345678901234567890' as Address
      ;(useReadContracts as any).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      hookTestUtils.renderHookWithQuery(() =>
        useTokenAllowance({
          tokenAddress,
          owner: sameAddress,
          spender: sameAddress,
          chainId,
          enabled: true,
        }),
      )

      const callArgs = (useReadContracts as any).mock.calls[0]?.[0]
      expect(callArgs.contracts[0].args).toEqual([sameAddress, sameAddress])
    })
  })
})
