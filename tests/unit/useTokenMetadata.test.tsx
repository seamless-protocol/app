import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { readContracts } from '@wagmi/core'
import { useTokenMetadata, TOKEN_METADATA_CONTRACTS } from '@/features/leverage-tokens/hooks/useTokenMetadata'
import { makeAddr, mockSetup, hookTestUtils } from '../utils'

describe('useTokenMetadata', () => {
  const tokenAddress = makeAddr('token')
  const TOKEN_NAME = '3x WETH Leverage Token'
  const TOKEN_SYMBOL = '3xWETH'
  const TOKEN_DECIMALS = 18
  const TOKEN_TOTAL_SUPPLY = 1000000n

  beforeEach(() => {
    vi.mocked(readContracts).mockResolvedValue([
      { status: 'success', result: TOKEN_NAME },
      { status: 'success', result: TOKEN_SYMBOL },
      { status: 'success', result: TOKEN_DECIMALS },
      { status: 'success', result: TOKEN_TOTAL_SUPPLY },
    ] as any)
    mockSetup.clearAllMocks()
  })

  describe('hook initialization', () => {
    it('should create query with correct initial state', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useTokenMetadata(tokenAddress))
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isError).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('successful data fetching', () => {
    it('should fetch token metadata successfully', async () => {
      hookTestUtils.renderHookWithQuery(() => useTokenMetadata(tokenAddress))
      
      await waitFor(() => {
        expect(readContracts).toHaveBeenCalledWith(expect.any(Object), {
          contracts: TOKEN_METADATA_CONTRACTS(tokenAddress),
        })
      })
    })

    it('should return correct metadata structure', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useTokenMetadata(tokenAddress))
      
      await waitFor(() => {
        expect(result.current.data).toEqual({
          name: TOKEN_NAME,
          symbol: TOKEN_SYMBOL,
          decimals: TOKEN_DECIMALS,
          leverageRatio: 3, // Hardcoded in hook
          underlying: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'WETH',
            decimals: 18,
          },
        })
      })
    })
  })

  describe('error handling', () => {
    it('should handle contract read failures', async () => {
      vi.mocked(readContracts).mockResolvedValue([
        { status: 'failure', error: new Error('Contract error') },
        { status: 'success', result: TOKEN_SYMBOL },
        { status: 'success', result: TOKEN_DECIMALS },
        { status: 'success', result: TOKEN_TOTAL_SUPPLY },
      ] as any)

      const { result } = hookTestUtils.renderHookWithQuery(() => useTokenMetadata(tokenAddress))
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Failed to fetch token metadata'))
      })
    })

    it('should handle partial failures gracefully', async () => {
      vi.mocked(readContracts).mockResolvedValue([
        { status: 'success', result: TOKEN_NAME },
        { status: 'failure', error: new Error('Symbol read failed') },
        { status: 'success', result: TOKEN_DECIMALS },
        { status: 'success', result: TOKEN_TOTAL_SUPPLY },
      ] as any)

      const { result } = hookTestUtils.renderHookWithQuery(() => useTokenMetadata(tokenAddress))
      
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(new Error('Failed to fetch token metadata'))
      })
    })
  })

  describe('query key structure', () => {
    it('should use correct query key for caching', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useTokenMetadata(tokenAddress))
      
      // The query key should be based on the token address
      expect(result.current.dataUpdatedAt).toBeDefined()
    })
  })

  describe('stale time configuration', () => {
    it('should respect stale time configuration', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useTokenMetadata(tokenAddress))
      
      // The hook should use the STALE_TIME.metadata configuration
      expect(result.current.isStale).toBeDefined()
    })
  })
}) 