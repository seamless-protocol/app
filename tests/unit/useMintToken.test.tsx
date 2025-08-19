import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simulateContract, waitForTransactionReceipt, writeContract } from '@wagmi/core'
import { useMintViaRouter } from '@/features/leverage-tokens/hooks/useMintViaRouter'
import { makeAddr, mockSetup, hookTestUtils, mockData } from '../utils'

describe('useMintViaRouter', () => {
  const tokenAddress = makeAddr('token')
  const ownerAddress = makeAddr('owner')
  const mockHash = mockData.transactionHash
  const mockReceipt = mockData.transactionReceipt(mockHash)
  const TOKEN_AMOUNT = 1000n

  beforeEach(() => {
    // Setup common mocks
    mockSetup.setupWagmiMocks(ownerAddress)
    
    // Setup wagmi core function mocks
    vi.mocked(simulateContract).mockResolvedValue({
      // request mirrors whatever simulateContract returns; we don't depend on exact shape
      request: { address: makeAddr('manager'), abi: [], functionName: 'mint' },
    } as any)
    vi.mocked(writeContract).mockResolvedValue(mockHash as any)
    vi.mocked(waitForTransactionReceipt).mockResolvedValue(mockReceipt as any)

    // Clear all mocks
    mockSetup.clearAllMocks()
  })

  describe('hook initialization', () => {
    it('should create a mutation with correct initial state', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )

      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
    })

    it('should have proper mutation configuration', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )

      // Verify the mutation has the expected properties
      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.reset).toBeDefined()
    })
  })

  describe('successful mutation flow (simulate → write → wait)', () => {
    it('should execute the full mint flow with correct parameters', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )

      await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })

      // Verify simulateContract was called with manager.mint(token, amount, minShares)
      expect(simulateContract).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          abi: expect.any(Array),
          functionName: 'mint',
          args: [tokenAddress, TOKEN_AMOUNT, expect.any(BigInt)],
          account: ownerAddress,
        })
      )

      // Verify writeContract was called with the simulated request
      expect(writeContract).toHaveBeenCalled()

      // Verify waitForTransactionReceipt was called
      expect(waitForTransactionReceipt).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          hash: mockHash,
          confirmations: 1, // From TX_SETTINGS
        })
      )
    })

    it('should return correct result after successful mint', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )

      const mutationResult = await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })

      expect(mutationResult).toEqual({ hash: mockHash, receipt: mockReceipt })
    })

    it('should call onSuccess callback with transaction hash', async () => {
      const onSuccess = vi.fn()
      
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress, onSuccess })
      )

      await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })

      expect(onSuccess).toHaveBeenCalledWith(mockHash)
    })
  })

  describe('query invalidation (no optimistic updates)', () => {
    it('should invalidate relevant queries after successful mint', async () => {
      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })

      // Should invalidate user balance query
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['leverage-tokens', 'tokens', tokenAddress, 'user', ownerAddress],
      })

      // Should invalidate portfolio query
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['portfolio', ownerAddress],
      })

      // Should invalidate token supply query
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['leverage-tokens', 'tokens', tokenAddress, 'supply'],
      })
    })

    it('should not invalidate queries on error', async () => {
      vi.mocked(simulateContract).mockRejectedValue(new Error('Test error'))
      
      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (error) {
        // Expected to throw
      }

      expect(invalidateQueriesSpy).not.toHaveBeenCalled()
    })
  })

  describe('error scenarios', () => {
    it('should throw error when wallet is not connected', async () => {
      mockSetup.setupWagmiMocks(undefined as any) // No wallet connected
      
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )

      await expect(result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })).rejects.toThrow(
        'WALLET_NOT_CONNECTED: Please connect your wallet before minting tokens'
      )
    })

    it('should handle simulation errors', async () => {
      const simulationError = new Error('Simulation failed')
      vi.mocked(simulateContract).mockRejectedValue(simulationError)
      
      const onError = vi.fn()
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress, onError })
      )

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (error) {
        // Expected to throw
      }

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNKNOWN',
          message: 'Simulation failed',
        })
      )
    })

    it('should handle write contract errors', async () => {
      const writeError = new Error('Transaction failed')
      vi.mocked(writeContract).mockRejectedValue(writeError)
      
      const onError = vi.fn()
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress, onError })
      )

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (error) {
        // Expected to throw
      }

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNKNOWN',
          message: 'Transaction failed',
        })
      )
    })
  })

  describe('error classification and logging', () => {
    it('should classify and log actionable errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Unknown error should be logged (actionable)
      const actionableError = new Error('RPC Error')
      vi.mocked(simulateContract).mockRejectedValue(actionableError)
      
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('[Mint Error]', expect.objectContaining({
        type: 'UNKNOWN',
        chainId: 8453,
        token: tokenAddress,
      }))

      consoleSpy.mockRestore()
    })

    it('should not log user rejected errors (non-actionable)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // User rejected error should not be logged (non-actionable)
      const userRejectedError = new Error('User rejected')
      ;(userRejectedError as any).code = 4001
      vi.mocked(simulateContract).mockRejectedValue(userRejectedError)
      
      const { result } = hookTestUtils.renderHookWithQuery(() => 
        useMintViaRouter({ token: tokenAddress })
      )

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
}) 
