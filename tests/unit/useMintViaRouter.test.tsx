import { waitFor } from '@testing-library/react'
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMintViaRouter } from '@/features/leverage-tokens/hooks/useMintViaRouter'
import * as contractAddresses from '@/lib/contracts/addresses'
import { hookTestUtils, makeAddr, mockData, mockSetup } from '../utils'

describe('useMintViaRouter', () => {
  const tokenAddress = makeAddr('token')
  const ownerAddress = makeAddr('owner')
  const routerAddress = makeAddr('router')
  const managerAddress = makeAddr('manager')
  const mockHash = mockData.transactionHash
  const mockReceipt = mockData.transactionReceipt(mockHash)
  const TOKEN_AMOUNT = 1000n

  beforeEach(() => {
    // Setup common mocks
    mockSetup.setupWagmiMocks(ownerAddress)

    // Mock contract addresses - already mocked in tests/setup.ts
    const mockGetContractAddresses = contractAddresses.getContractAddresses as any
    mockGetContractAddresses.mockReturnValue({
      leverageRouter: routerAddress,
      leverageManager: managerAddress,
    })

    // Debug: Log what's being returned
    console.log('Mocked addresses:', {
      leverageRouter: routerAddress,
      leverageManager: managerAddress,
    })

    // Setup wagmi core function mocks - already mocked in tests/setup.ts
    const mockReadContract = readContract as any
    mockReadContract.mockImplementation(async (_config: any, params: any) => {
      // Mock different contract calls based on function name
      if (params.functionName === 'previewMint') {
        return { shares: 1000n, tokenFee: 0n, treasuryFee: 0n }
      }
      if (params.functionName === 'getLeverageTokenCollateralAsset') {
        return makeAddr('collateralAsset')
      }
      if (params.functionName === 'getLeverageTokenDebtAsset') {
        return makeAddr('debtAsset')
      }
      if (params.functionName === 'allowance') {
        return 0n // No allowance initially
      }
      if (params.functionName === 'balanceOf') {
        return 1000000n // Mock balance
      }
      if (params.functionName === 'symbol') {
        return 'WETH'
      }
      if (params.functionName === 'decimals') {
        return 18
      }
      return 0n // Default to 0n instead of null
    })

    const mockSimulateContract = simulateContract as any
    const mockWriteContract = writeContract as any
    const mockWaitForTransactionReceipt = waitForTransactionReceipt as any

    mockSimulateContract.mockResolvedValue({
      // request mirrors whatever simulateContract returns; we don't depend on exact shape
      request: { address: routerAddress, abi: [], functionName: 'mint' },
    })
    mockWriteContract.mockResolvedValue(mockHash)
    mockWaitForTransactionReceipt.mockResolvedValue(mockReceipt)

    // Clear all mocks
    mockSetup.clearAllMocks()
  })

  describe('hook initialization', () => {
    it('should verify contract addresses are mocked', () => {
      const addresses = contractAddresses.getContractAddresses(8453)
      expect(addresses.leverageRouter).toBe(routerAddress)
      expect(addresses.leverageManager).toBe(managerAddress)
    })

    it('should create a mutation with correct initial state', () => {
      // Ensure mocks are set up before hook initialization
      const mockGetContractAddresses = contractAddresses.getContractAddresses as any
      mockGetContractAddresses.mockReturnValue({
        leverageRouter: routerAddress,
        leverageManager: managerAddress,
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )

      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
    })

    it('should have proper mutation configuration', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )

      // Verify the mutation has the expected properties
      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.reset).toBeDefined()
    })
  })

  describe('successful mutation flow (preview → approve → simulate → write → wait)', () => {
    it('should execute the full Router-based mint flow with correct parameters', async () => {
      // Ensure mocks are set up before hook initialization
      const mockGetContractAddresses = contractAddresses.getContractAddresses as any
      mockGetContractAddresses.mockReturnValue({
        leverageRouter: routerAddress,
        leverageManager: managerAddress,
      })

      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })

      // Verify simulateContract was called with router.mint(token, amount, minShares, maxSwapCost, swapContext)
      expect(simulateContract).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          abi: expect.any(Array),
          functionName: 'mint',
          args: [
            tokenAddress,
            TOKEN_AMOUNT,
            expect.any(BigInt), // minShares
            expect.any(BigInt), // maxSwapCost
            expect.objectContaining({
              // swapContext
              path: expect.any(Array),
              exchange: expect.any(Number),
              exchangeAddresses: expect.any(Object),
            }),
          ],
          account: ownerAddress,
        }),
      )

      // Verify writeContract was called with the simulated request
      expect(writeContract).toHaveBeenCalled()

      // Verify waitForTransactionReceipt was called
      expect(waitForTransactionReceipt).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          hash: mockHash,
          confirmations: 1, // From TX_SETTINGS
        }),
      )
    })

    it('should return correct result after successful mint', async () => {
      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      const mutationResult = await result.current.mutateAsync({
        equityInCollateralAsset: TOKEN_AMOUNT,
      })

      expect(mutationResult).toEqual({
        hash: mockHash,
        receipt: mockReceipt,
        preview: expect.objectContaining({
          shares: expect.any(BigInt),
        }),
        minShares: expect.any(BigInt),
        slippageBps: expect.any(Number),
      })
    })

    it('should call onSuccess callback with transaction hash', async () => {
      const onSuccess = vi.fn()

      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress, onSuccess }),
      )

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })

      expect(onSuccess).toHaveBeenCalledWith(mockHash)
    })
  })

  describe('query invalidation (no optimistic updates)', () => {
    it('should invalidate relevant queries after successful mint', async () => {
      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

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
      const mockSimulateContract = simulateContract as any
      mockSimulateContract.mockRejectedValue(new Error('Test error'))

      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (_error) {
        // Expected to throw
      }

      expect(invalidateQueriesSpy).not.toHaveBeenCalled()
    })
  })

  describe('error scenarios', () => {
    it('should throw error when wallet is not connected', async () => {
      mockSetup.setupWagmiMocks(undefined as any) // No wallet connected

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )

      await expect(
        result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT }),
      ).rejects.toThrow('WALLET_NOT_CONNECTED: Please connect your wallet before minting tokens')
    })

    it('should handle simulation errors', async () => {
      const simulationError = new Error('Simulation failed')
      const mockSimulateContract = simulateContract as any
      mockSimulateContract.mockRejectedValue(simulationError)

      const onError = vi.fn()
      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress, onError }),
      )

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (_error) {
        // Expected to throw
      }

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNKNOWN',
          message: 'Simulation failed',
        }),
      )
    })

    it('should handle write contract errors', async () => {
      const writeError = new Error('Transaction failed')
      const mockWriteContract = writeContract as any
      mockWriteContract.mockRejectedValue(writeError)

      const onError = vi.fn()
      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress, onError }),
      )

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (_error) {
        // Expected to throw
      }

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNKNOWN',
          message: 'Transaction failed',
        }),
      )
    })
  })

  describe('error classification and logging', () => {
    it('should classify and log actionable errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Unknown error should be logged (actionable)
      const actionableError = new Error('RPC Error')
      const mockSimulateContract = simulateContract as any
      mockSimulateContract.mockRejectedValue(actionableError)

      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (_error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        '[LeverageTokens] mint token failed',
        expect.objectContaining({
          chainId: 8453,
          token: tokenAddress,
          method: 'mint',
          error: expect.objectContaining({
            type: 'UNKNOWN',
          }),
          feature: 'leverage-tokens',
        }),
      )

      consoleSpy.mockRestore()
    })

    it('should not log user rejected errors (non-actionable)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // User rejected error should not be logged (non-actionable)
      const userRejectedError = new Error('User rejected')
      ;(userRejectedError as any).code = 4001
      const mockSimulateContract = simulateContract as any
      mockSimulateContract.mockRejectedValue(userRejectedError)

      const { result, queryClient } = hookTestUtils.renderHookWithQuery(() =>
        useMintViaRouter({ token: tokenAddress }),
      )

      // Set the query data directly to ensure the collateral asset is available
      queryClient.setQueryData(['collateralAsset', tokenAddress, 8453], makeAddr('collateralAsset'))

      // Wait for the mutation to be ready
      await waitFor(() => {
        expect(result.current.mutate).toBeDefined()
        expect(result.current.mutateAsync).toBeDefined()
      })

      try {
        await result.current.mutateAsync({ equityInCollateralAsset: TOKEN_AMOUNT })
      } catch (_error) {
        // Expected to throw
      }

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
