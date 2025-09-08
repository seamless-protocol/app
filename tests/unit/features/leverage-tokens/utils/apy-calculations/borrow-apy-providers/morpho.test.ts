import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'

// Mock wagmi actions
vi.mock('wagmi/actions', () => ({
  readContract: vi.fn(),
}))

// Mock contract addresses
vi.mock('@/lib/contracts/addresses', () => ({
  getLeverageManagerAddress: vi.fn(),
}))

// Mock GraphQL fetchers
vi.mock('@/lib/graphql/fetchers/morpho', () => ({
  fetchMorphoMarketBorrowRate: vi.fn(),
}))

import { readContract } from 'wagmi/actions'
import { MorphoBorrowApyProvider } from '@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers/morpho'
import { getLeverageManagerAddress } from '@/lib/contracts/addresses'
import { fetchMorphoMarketBorrowRate } from '@/lib/graphql/fetchers/morpho'

// Mock the external dependencies
const mockReadContract = vi.mocked(readContract)
const mockGetLeverageManagerAddress = vi.mocked(getLeverageManagerAddress)
const mockFetchMorphoMarketBorrowRate = vi.mocked(fetchMorphoMarketBorrowRate)

describe('MorphoBorrowApyProvider', () => {
  const provider = new MorphoBorrowApyProvider()
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address
  const chainId = 8453
  const mockConfig = {} as Config

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('provider properties', () => {
    it('should have correct protocol identification', () => {
      expect(provider.protocolId).toBe('morpho')
      expect(provider.protocolName).toBe('Morpho')
    })
  })

  describe('fetchBorrowApy', () => {
    it('should fetch borrow APY successfully', async () => {
      // Mock the contract calls and GraphQL response
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockLendingAdapterAddress = '0x9876543210987654321098765432109876543210' as Address
      const mockMarketId = '0xabcdef1234567890abcdef1234567890abcdef12'

      const mockManagerResult = {
        lendingAdapter: mockLendingAdapterAddress,
        rebalanceAdapter: '0x1111111111111111111111111111111111111111' as Address,
        mintTokenFee: 0n,
        redeemTokenFee: 10n,
      }

      const mockGraphQLResponse = {
        marketByUniqueKey: {
          state: {
            borrowApy: 0.0387, // 3.87% as decimal
          },
        },
      }

      // Setup mocks
      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract
        .mockResolvedValueOnce(mockManagerResult) // First call for leverage token config
        .mockResolvedValueOnce(mockMarketId) // Second call for market ID
      mockFetchMorphoMarketBorrowRate.mockResolvedValue(mockGraphQLResponse)

      const result = await provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)

      // Verify the result
      expect(result).toEqual({
        borrowAPY: 0.0387,
      })

      // Verify contract calls
      expect(mockGetLeverageManagerAddress).toHaveBeenCalledWith(chainId)
      expect(mockReadContract).toHaveBeenCalledTimes(2)

      // First call: get leverage token config
      expect(mockReadContract).toHaveBeenNthCalledWith(1, mockConfig, {
        address: mockManagerAddress,
        abi: expect.any(Object), // leverageManagerAbi
        functionName: 'getLeverageTokenConfig',
        args: [tokenAddress],
      })

      // Second call: get market ID from lending adapter
      expect(mockReadContract).toHaveBeenNthCalledWith(2, mockConfig, {
        address: mockLendingAdapterAddress,
        abi: expect.any(Object), // lendingAdapterAbi
        functionName: 'morphoMarketId',
      })

      // Verify GraphQL call
      expect(mockFetchMorphoMarketBorrowRate).toHaveBeenCalledWith(mockMarketId, chainId)
    })

    it('should handle missing chain ID and config', async () => {
      await expect(provider.fetchBorrowApy(tokenAddress)).rejects.toThrow(
        'Chain ID and config are required for fetching Morpho market ID',
      )
    })

    it('should handle missing leverage manager address', async () => {
      mockGetLeverageManagerAddress.mockReturnValue(undefined)

      await expect(provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)).rejects.toThrow(
        'No leverage manager address found for chain ID: 8453',
      )
    })

    it('should handle missing leverage token config', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockResolvedValueOnce(null)

      await expect(provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)).rejects.toThrow(
        'No leverage token config found for address: 0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c',
      )
    })

    it('should handle missing lending adapter in config', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockManagerResult = {
        lendingAdapter: null,
        rebalanceAdapter: '0x1111111111111111111111111111111111111111' as Address,
        mintTokenFee: 0n,
        redeemTokenFee: 10n,
      }

      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockResolvedValueOnce(mockManagerResult)

      await expect(provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)).rejects.toThrow(
        'No lending adapter found in leverage token config',
      )
    })

    it('should handle missing market ID from lending adapter', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockLendingAdapterAddress = '0x9876543210987654321098765432109876543210' as Address
      const mockManagerResult = {
        lendingAdapter: mockLendingAdapterAddress,
        rebalanceAdapter: '0x1111111111111111111111111111111111111111' as Address,
        mintTokenFee: 0n,
        redeemTokenFee: 10n,
      }

      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockResolvedValueOnce(mockManagerResult).mockResolvedValueOnce(null) // No market ID

      await expect(provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)).rejects.toThrow(
        'No market ID found from lending adapter',
      )
    })

    it('should handle GraphQL response with no market data', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockLendingAdapterAddress = '0x9876543210987654321098765432109876543210' as Address
      const mockMarketId = '0xabcdef1234567890abcdef1234567890abcdef12'

      const mockManagerResult = {
        lendingAdapter: mockLendingAdapterAddress,
        rebalanceAdapter: '0x1111111111111111111111111111111111111111' as Address,
        mintTokenFee: 0n,
        redeemTokenFee: 10n,
      }

      const mockGraphQLResponse = {
        marketByUniqueKey: null,
      }

      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockResolvedValueOnce(mockManagerResult).mockResolvedValueOnce(mockMarketId)
      mockFetchMorphoMarketBorrowRate.mockResolvedValue(mockGraphQLResponse)

      await expect(provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)).rejects.toThrow(
        'No market data found for unique key: 0xabcdef1234567890abcdef1234567890abcdef12',
      )
    })

    it('should handle contract call errors', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const contractError = new Error('Contract call failed')

      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockRejectedValueOnce(contractError)

      await expect(provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)).rejects.toThrow(
        'Failed to fetch Morpho market ID: Contract call failed',
      )
    })

    it('should handle GraphQL call errors', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockLendingAdapterAddress = '0x9876543210987654321098765432109876543210' as Address
      const mockMarketId = '0xabcdef1234567890abcdef1234567890abcdef12'

      const mockManagerResult = {
        lendingAdapter: mockLendingAdapterAddress,
        rebalanceAdapter: '0x1111111111111111111111111111111111111111' as Address,
        mintTokenFee: 0n,
        redeemTokenFee: 10n,
      }

      const graphqlError = new Error('GraphQL request failed')

      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockResolvedValueOnce(mockManagerResult).mockResolvedValueOnce(mockMarketId)
      mockFetchMorphoMarketBorrowRate.mockRejectedValue(graphqlError)

      await expect(provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)).rejects.toThrow(
        'GraphQL request failed',
      )
    })

    it('should handle zero borrow APY', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockLendingAdapterAddress = '0x9876543210987654321098765432109876543210' as Address
      const mockMarketId = '0xabcdef1234567890abcdef1234567890abcdef12'

      const mockManagerResult = {
        lendingAdapter: mockLendingAdapterAddress,
        rebalanceAdapter: '0x1111111111111111111111111111111111111111' as Address,
        mintTokenFee: 0n,
        redeemTokenFee: 10n,
      }

      const mockGraphQLResponse = {
        marketByUniqueKey: {
          state: {
            borrowApy: 0, // Zero borrow APY
          },
        },
      }

      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockResolvedValueOnce(mockManagerResult).mockResolvedValueOnce(mockMarketId)
      mockFetchMorphoMarketBorrowRate.mockResolvedValue(mockGraphQLResponse)

      const result = await provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)

      expect(result).toEqual({
        borrowAPY: 0,
      })
    })

    it('should handle very high borrow APY', async () => {
      const mockManagerAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockLendingAdapterAddress = '0x9876543210987654321098765432109876543210' as Address
      const mockMarketId = '0xabcdef1234567890abcdef1234567890abcdef12'

      const mockManagerResult = {
        lendingAdapter: mockLendingAdapterAddress,
        rebalanceAdapter: '0x1111111111111111111111111111111111111111' as Address,
        mintTokenFee: 0n,
        redeemTokenFee: 10n,
      }

      const mockGraphQLResponse = {
        marketByUniqueKey: {
          state: {
            borrowApy: 0.5, // 50% borrow APY
          },
        },
      }

      mockGetLeverageManagerAddress.mockReturnValue(mockManagerAddress)
      mockReadContract.mockResolvedValueOnce(mockManagerResult).mockResolvedValueOnce(mockMarketId)
      mockFetchMorphoMarketBorrowRate.mockResolvedValue(mockGraphQLResponse)

      const result = await provider.fetchBorrowApy(tokenAddress, chainId, mockConfig)

      expect(result).toEqual({
        borrowAPY: 0.5,
      })
    })
  })
})
