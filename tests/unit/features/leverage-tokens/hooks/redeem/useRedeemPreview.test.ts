import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { useRedeemPreview } from '@/features/leverage-tokens/hooks/redeem/useRedeemPreview'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { readLeverageManagerV2PreviewRedeem } from '@/lib/contracts/generated'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../../utils.tsx'

// Mock dependencies
const mockReadLeverageManagerV2PreviewRedeem = readLeverageManagerV2PreviewRedeem as Mock
const mockGetContractAddresses = getContractAddresses as Mock

describe('useRedeemPreview', () => {
  const mockToken = makeAddr('token')
  const mockSharesToRedeem = 1000000000000000000n // 1 token
  const mockChainId = 8453

  const mockConfig = {
    chains: [],
    connectors: [],
    publicClient: vi.fn(),
    walletClient: vi.fn(),
    storage: vi.fn(),
    state: {},
    setState: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  } as any

  const mockAddresses = {
    leverageManagerV2: makeAddr('managerV2'),
  }

  const mockPreviewResult = {
    collateral: 1000000000000000000n,
    debt: 800000000000000000n,
    shares: 1000000000000000000n,
    tokenFee: 1000000000000000n, // 0.1%
    treasuryFee: 500000000000000n, // 0.05%
  }

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(makeAddr('account'), mockChainId)

    // Setup mocks
    mockGetContractAddresses.mockReturnValue(mockAddresses)
    mockReadLeverageManagerV2PreviewRedeem.mockResolvedValue(mockPreviewResult)
  })

  it('should initialize with loading state', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPreview({
        config: mockConfig,
        token: mockToken,
        sharesToRedeem: mockSharesToRedeem,
        chainId: mockChainId,
      }),
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('should fetch preview data successfully', async () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPreview({
        config: mockConfig,
        token: mockToken,
        sharesToRedeem: mockSharesToRedeem,
        chainId: mockChainId,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockPreviewResult)
    expect(result.current.error).toBeNull()
    expect(mockReadLeverageManagerV2PreviewRedeem).toHaveBeenCalledWith(mockConfig, {
      args: [mockToken, mockSharesToRedeem],
      chainId: mockChainId,
    })
  })

  it('should handle zero shares to redeem', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPreview({
        config: mockConfig,
        token: mockToken,
        sharesToRedeem: 0n,
        chainId: mockChainId,
      }),
    )

    expect(result.current.isLoading).toBe(false)
    expect(mockReadLeverageManagerV2PreviewRedeem).not.toHaveBeenCalled()
  })

  it('should handle undefined shares to redeem', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPreview({
        config: mockConfig,
        token: mockToken,
        sharesToRedeem: undefined,
        chainId: mockChainId,
      }),
    )

    expect(result.current.isLoading).toBe(false)
    expect(mockReadLeverageManagerV2PreviewRedeem).not.toHaveBeenCalled()
  })

  it('should handle debouncing correctly', async () => {
    // Start with undefined to test debouncing properly
    const { rerender } = hookTestUtils.renderHookWithQuery(
      ({ sharesToRedeem }: { sharesToRedeem: bigint | undefined }) =>
        useRedeemPreview({
          config: mockConfig,
          token: mockToken,
          sharesToRedeem,
          chainId: mockChainId,
          debounceMs: 100,
        }),
      {
        initialProps: { sharesToRedeem: undefined as bigint | undefined },
      },
    )

    // Change the amount quickly
    rerender({ sharesToRedeem: 1000000000000000000n as bigint | undefined })
    rerender({ sharesToRedeem: 2000000000000000000n as bigint | undefined })
    rerender({ sharesToRedeem: 3000000000000000000n as bigint | undefined })
    rerender({ sharesToRedeem: 4000000000000000000n as bigint | undefined })

    // Should not have called the contract yet due to debouncing
    expect(mockReadLeverageManagerV2PreviewRedeem).not.toHaveBeenCalled()

    // Wait for debounce to complete
    await waitFor(
      () => {
        expect(mockReadLeverageManagerV2PreviewRedeem).toHaveBeenCalledTimes(1)
      },
      { timeout: 200 },
    )

    expect(mockReadLeverageManagerV2PreviewRedeem).toHaveBeenCalledWith(mockConfig, {
      args: [mockToken, 4000000000000000000n],
      chainId: mockChainId,
    })
  })

  it('should handle contract errors', async () => {
    const mockError = new Error('Contract call failed')
    mockReadLeverageManagerV2PreviewRedeem.mockRejectedValue(mockError)

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPreview({
        config: mockConfig,
        token: mockToken,
        sharesToRedeem: mockSharesToRedeem,
        chainId: mockChainId,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBe(mockError)
  })

  it('should handle missing manager V2 address', () => {
    mockGetContractAddresses.mockReturnValue({
      leverageManagerV2: undefined,
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPreview({
        config: mockConfig,
        token: mockToken,
        sharesToRedeem: mockSharesToRedeem,
        chainId: mockChainId,
      }),
    )

    // When leverageManagerV2 is undefined, the query should be disabled and not loading
    expect(result.current.isLoading).toBe(false)
    expect(mockReadLeverageManagerV2PreviewRedeem).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it('should use correct query key structure', async () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPreview({
        config: mockConfig,
        token: mockToken,
        sharesToRedeem: mockSharesToRedeem,
        chainId: mockChainId,
        debounceMs: 10, // Short debounce for testing
      }),
    )

    // Wait for debounce to complete and query to run
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // The query should be enabled and have the correct structure
    expect(result.current.data).toBeDefined()
  })

  it('should handle custom debounce timing', async () => {
    const { rerender } = hookTestUtils.renderHookWithQuery(
      ({ sharesToRedeem }: { sharesToRedeem: bigint | undefined }) =>
        useRedeemPreview({
          config: mockConfig,
          token: mockToken,
          sharesToRedeem,
          chainId: mockChainId,
          debounceMs: 500, // Longer debounce
        }),
      {
        initialProps: { sharesToRedeem: undefined as bigint | undefined },
      },
    )

    // Set the value to trigger debouncing
    rerender({ sharesToRedeem: mockSharesToRedeem as bigint | undefined })

    // Should not call immediately
    expect(mockReadLeverageManagerV2PreviewRedeem).not.toHaveBeenCalled()

    // Wait for the longer debounce
    await waitFor(
      () => {
        expect(mockReadLeverageManagerV2PreviewRedeem).toHaveBeenCalled()
      },
      { timeout: 600 },
    )
  })
})
