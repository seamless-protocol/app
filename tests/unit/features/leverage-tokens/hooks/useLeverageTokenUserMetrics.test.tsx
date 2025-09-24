import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, type Mock } from 'vitest'
import { useAccount } from 'wagmi'
import { useLeverageTokenUserMetrics } from '@/features/leverage-tokens/hooks/useLeverageTokenUserMetrics'
import { fetchUserLeverageTokenPosition } from '@/lib/graphql/fetchers/leverage-tokens'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../utils'

const mockFetchUserLeverageTokenPosition = fetchUserLeverageTokenPosition as Mock

describe('useLeverageTokenUserMetrics', () => {
  const tokenAddress = makeAddr('token')
  const ownerAddress = makeAddr('owner')

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(ownerAddress, 8453)
  })

  it('returns deposited collateral metrics when position data is available', async () => {
    const depositedCollateral = (123n * 10n ** 18n).toString()
    const depositedDebt = (45n * 10n ** 18n).toString()

    mockFetchUserLeverageTokenPosition.mockResolvedValue({
      user: {
        positions: [
          {
            id: 'position-1',
            balance: '0',
            totalEquityDepositedInCollateral: depositedCollateral,
            totalEquityDepositedInDebt: depositedDebt,
          },
        ],
      },
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUserMetrics({
        tokenAddress,
        chainId: 8453,
        collateralDecimals: 18,
      }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetchUserLeverageTokenPosition).toHaveBeenCalledWith({
      userAddress: ownerAddress,
      leverageTokenAddress: tokenAddress,
      chainId: 8453,
    })
    expect(result.current.data?.depositedCollateral).toBe(123n * 10n ** 18n)
    expect(result.current.data?.depositedCollateralFormatted).toBe('123')
    expect(result.current.data?.depositedDebt).toBe(45n * 10n ** 18n)
  })

  it('returns zeroed metrics when the user has no position', async () => {
    mockFetchUserLeverageTokenPosition.mockResolvedValue({
      user: {
        positions: [],
      },
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUserMetrics({
        tokenAddress,
        chainId: 8453,
        collateralDecimals: 18,
      }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.depositedCollateral).toBe(0n)
    expect(result.current.data?.depositedCollateralFormatted).toBe('0')
    expect(result.current.data?.depositedDebt).toBe(0n)
  })

  it('does not run the query when the user address is missing', async () => {
    mockSetup.clearAllMocks()
    ;(useAccount as Mock).mockReturnValue({ address: undefined })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUserMetrics({
        tokenAddress,
        chainId: 8453,
        collateralDecimals: 18,
      }),
    )

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(mockFetchUserLeverageTokenPosition).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })
})
