import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { createCollateralToDebtQuote } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { useCollateralToDebtQuote } from '@/features/leverage-tokens/hooks/redeem/useCollateralToDebtQuote'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../../utils.tsx'

// Mock dependencies
const mockCreateCollateralToDebtQuote = createCollateralToDebtQuote as Mock

describe('useCollateralToDebtQuote', () => {
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

  it('should return not-required when quote is not required', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
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
      useCollateralToDebtQuote({
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
      useCollateralToDebtQuote({
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

  it('should return ready when all prerequisites are met', () => {
    mockCreateCollateralToDebtQuote.mockReturnValue({
      quote: mockQuote,
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
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
    expect(mockCreateCollateralToDebtQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        getPublicClient: expect.any(Function),
      }),
    )
  })

  it('should handle missing client error', () => {
    const mockError = new Error('Public client unavailable')
    mockCreateCollateralToDebtQuote.mockImplementation(() => {
      throw mockError
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
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

  it('should handle missing chain config error', () => {
    const mockError = new Error('Missing Uniswap V3 configuration')
    mockCreateCollateralToDebtQuote.mockImplementation(() => {
      throw mockError
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
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
  })

  it('should handle missing wrapped native token error', () => {
    const mockError = new Error('Missing wrapped native token for Uniswap V2')
    mockCreateCollateralToDebtQuote.mockImplementation(() => {
      throw mockError
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
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
  })

  it('should handle generic errors', () => {
    const mockError = new Error('Generic error')
    mockCreateCollateralToDebtQuote.mockImplementation(() => {
      throw mockError
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        requiresQuote: true,
      }),
    )

    expect(result.current.status).toBe('error')
    expect(result.current.quote).toBeUndefined()
    expect(result.current.error).toBe(mockError)
  })

  it('should handle non-Error exceptions', () => {
    mockCreateCollateralToDebtQuote.mockImplementation(() => {
      throw 'String error'
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        requiresQuote: true,
      }),
    )

    expect(result.current.status).toBe('error')
    expect(result.current.quote).toBeUndefined()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('String error')
  })

  it('should pass correct parameters to createCollateralToDebtQuote', () => {
    mockCreateCollateralToDebtQuote.mockReturnValue({
      quote: mockQuote,
    })

    hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        requiresQuote: true,
      }),
    )

    expect(mockCreateCollateralToDebtQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        getPublicClient: expect.any(Function),
      }),
    )
  })

  it('should provide correct getPublicClient function', () => {
    mockCreateCollateralToDebtQuote.mockReturnValue({
      quote: mockQuote,
    })

    hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        requiresQuote: true,
      }),
    )

    const callArgs = mockCreateCollateralToDebtQuote.mock.calls[0]?.[0] as any
    const getPublicClient = callArgs.getPublicClient

    // Test that getPublicClient returns undefined for different chain IDs
    expect(getPublicClient(1)).toBeUndefined()
    expect(getPublicClient(8453)).toBeDefined() // Should return the public client for the correct chain
  })

  it('should handle different chain IDs', () => {
    const differentChainId = 1 // Ethereum mainnet
    mockCreateCollateralToDebtQuote.mockReturnValue({
      quote: mockQuote,
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
        chainId: differentChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        requiresQuote: true,
      }),
    )

    expect(result.current.status).toBe('ready')
    expect(mockCreateCollateralToDebtQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: differentChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: mockSlippageBps,
        getPublicClient: expect.any(Function),
      }),
    )
  })

  it('should handle different slippage values', () => {
    const customSlippageBps = 100
    mockCreateCollateralToDebtQuote.mockReturnValue({
      quote: mockQuote,
    })

    hookTestUtils.renderHookWithQuery(() =>
      useCollateralToDebtQuote({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: customSlippageBps,
        requiresQuote: true,
      }),
    )

    expect(mockCreateCollateralToDebtQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: mockChainId,
        routerAddress: mockRouterAddress,
        swap: mockSwap,
        slippageBps: customSlippageBps,
        getPublicClient: expect.any(Function),
      }),
    )
  })
})
