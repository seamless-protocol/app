import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { createDebtToCollateralQuote } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { useDebtToCollateralQuote } from '@/features/leverage-tokens/hooks/mint/useDebtToCollateralQuote'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../../utils.tsx'

// Mock dependencies
vi.mock('@/domain/mint/utils/createDebtToCollateralQuote', () => ({
  createDebtToCollateralQuote: vi.fn(),
}))

const mockCreateDebtToCollateralQuote = createDebtToCollateralQuote as Mock

describe('useDebtToCollateralQuote', () => {
  const mockChainId = 8453
  const mockRouterAddress = makeAddr('router')
  const mockSlippageBps = 50

  const mockSwap = {
    type: 'uniswapV3' as const,
    poolKey: 'weeth-weth' as const,
  }

  const mockQuote = vi.fn()

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(makeAddr('account'), mockChainId)
  })

  describe('Status Conditions', () => {
    it('should return not-required when quote is not required', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          requiresQuote: false,
        }),
      )

      expect(result.current.status).toBe('not-required')
      expect(result.current.quote).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })

    it('should return missing-config when swap is missing', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: undefined as any,
          slippageBps: mockSlippageBps,
          requiresQuote: true,
        }),
      )

      expect(result.current.status).toBe('missing-config')
      expect(result.current.quote).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })

    it('should return missing-router when router address is missing', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: undefined as any,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          requiresQuote: true,
        }),
      )

      expect(result.current.status).toBe('missing-router')
      expect(result.current.quote).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('Successful Execution', () => {
    it('should return ready when all prerequisites are met and pass parameters correctly', () => {
      mockCreateDebtToCollateralQuote.mockReturnValue({
        quote: mockQuote,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          requiresQuote: true,
        }),
      )

      expect(result.current.status).toBe('ready')
      expect(result.current.quote).toBe(mockQuote)
      expect(result.current.error).toBeUndefined()
      expect(mockCreateDebtToCollateralQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          getPublicClient: expect.any(Function),
        }),
      )

      // Test fromAddress handling
      const callArgs = mockCreateDebtToCollateralQuote.mock.calls[0]?.[0] as any
      expect(callArgs.fromAddress).toBeUndefined()

      // Test with fromAddress provided
      const mockFromAddress = makeAddr('from')
      mockCreateDebtToCollateralQuote.mockClear()

      hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          requiresQuote: true,
          fromAddress: mockFromAddress,
        }),
      )

      expect(mockCreateDebtToCollateralQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAddress: mockFromAddress,
        }),
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle missing client error', () => {
      const mockError = new Error('Public client unavailable for debt swap quote')
      mockCreateDebtToCollateralQuote.mockImplementation(() => {
        throw mockError
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          requiresQuote: true,
        }),
      )

      expect(result.current.status).toBe('missing-client')
      expect(result.current.quote).toBeUndefined()
      expect(result.current.error).toBe(mockError)
    })

    it('should handle missing chain configuration errors', () => {
      const errors = [
        new Error('Missing Uniswap V3 configuration'),
        new Error('Missing wrapped native token'),
      ]

      for (const mockError of errors) {
        mockCreateDebtToCollateralQuote.mockImplementation(() => {
          throw mockError
        })

        const { result } = hookTestUtils.renderHookWithQuery(() =>
          useDebtToCollateralQuote({
            chainId: mockChainId,
            routerAddress: mockRouterAddress,
            swap: mockSwap,
            slippageBps: mockSlippageBps,
            requiresQuote: true,
          }),
        )

        expect(result.current.status).toBe('missing-chain-config')
        expect(result.current.quote).toBeUndefined()
        expect(result.current.error).toBe(mockError)
      }
    })

    it('should handle generic errors and non-Error exceptions', () => {
      // Test generic Error
      const mockError = new Error('Generic error')
      mockCreateDebtToCollateralQuote.mockImplementation(() => {
        throw mockError
      })

      const { result: result1 } = hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          requiresQuote: true,
        }),
      )

      expect(result1.current.status).toBe('error')
      expect(result1.current.quote).toBeUndefined()
      expect(result1.current.error).toBe(mockError)

      // Test non-Error exception (converted to Error)
      mockCreateDebtToCollateralQuote.mockImplementation(() => {
        throw 'String error'
      })

      const { result: result2 } = hookTestUtils.renderHookWithQuery(() =>
        useDebtToCollateralQuote({
          chainId: mockChainId,
          routerAddress: mockRouterAddress,
          swap: mockSwap,
          slippageBps: mockSlippageBps,
          requiresQuote: true,
        }),
      )

      expect(result2.current.status).toBe('error')
      expect(result2.current.quote).toBeUndefined()
      expect(result2.current.error).toBeInstanceOf(Error)
      expect(result2.current.error?.message).toBe('String error')
    })
  })
})
