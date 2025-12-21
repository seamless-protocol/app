import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { useReadContracts } from 'wagmi'
import { useLeverageTokenUsdPrice } from '@/features/leverage-tokens/hooks/useLeverageTokenUsdPrice'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { STALE_TIME } from '@/features/leverage-tokens/utils/constants'
import { getLeverageManagerAddress } from '@/lib/contracts/addresses'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../utils.tsx'

vi.mock('@/lib/prices/useUsdPrices', () => ({
  useUsdPrices: vi.fn(),
}))

const mockUseReadContracts = useReadContracts as Mock
const mockUseUsdPrices = useUsdPrices as Mock
const mockGetLeverageTokenConfig = getLeverageTokenConfig as Mock
const mockGetLeverageManagerAddress = getLeverageManagerAddress as Mock

describe('useLeverageTokenUsdPrice', () => {
  const chainId = 8453
  const managerAddress = makeAddr('manager')
  const tokenAddress = makeAddr('token')
  const collateralAddress =
    '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD' satisfies string as `0x${string}`
  const debtAddress = '0x1234567890ABCDEF1234567890ABCDEF12345678' satisfies string as `0x${string}`

  const createConfig = () => ({
    address: tokenAddress,
    chainId,
    decimals: 18,
    collateralAsset: { address: collateralAddress, decimals: 18 },
    debtAsset: { address: debtAddress, decimals: 18 },
  })

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(makeAddr('owner'), chainId)

    ;(STALE_TIME as Record<string, number>)['price'] = STALE_TIME.price ?? 10_000
    mockGetLeverageManagerAddress.mockReturnValue(managerAddress)
    mockGetLeverageTokenConfig.mockReturnValue(createConfig())

    mockUseReadContracts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
    })

    mockUseUsdPrices.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      error: undefined,
    })
  })

  it('disables queries when token config is missing', () => {
    mockGetLeverageTokenConfig.mockReturnValueOnce(undefined)

    hookTestUtils.renderHookWithQuery(() => useLeverageTokenUsdPrice({ tokenAddress }))

    const contractsArgs = mockUseReadContracts.mock.calls[0]?.[0]
    const usdPricesArgs = mockUseUsdPrices.mock.calls[0]?.[0]

    expect(contractsArgs?.query?.enabled).toBe(false)
    expect(usdPricesArgs?.enabled).toBe(false)
    expect(usdPricesArgs?.addresses).toEqual([])
  })

  it('returns usd price when contract and price data are ready', () => {
    const totalSupply = 1_000_000_000_000_000_000n
    const equity = 2_000_000_000_000_000_000n

    mockUseReadContracts.mockReturnValueOnce({
      data: [{ result: totalSupply }, { result: { equity } }],
      isLoading: false,
      isError: false,
      error: undefined,
    })

    mockUseUsdPrices.mockReturnValueOnce({
      data: {
        [collateralAddress.toLowerCase()]: 1.5,
        [debtAddress.toLowerCase()]: 2,
      },
      isLoading: false,
      isError: false,
      error: undefined,
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUsdPrice({ tokenAddress }),
    )

    expect(result.current.data).toBe(400_000_000n)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)

    const contractsArgs = mockUseReadContracts.mock.calls[0]?.[0]
    expect(contractsArgs?.contracts?.[0]?.address).toBe(managerAddress)
    expect(contractsArgs?.contracts?.[0]?.args).toEqual([tokenAddress])
    expect(contractsArgs?.query?.enabled).toBe(true)

    const usdPricesArgs = mockUseUsdPrices.mock.calls[0]?.[0]
    expect(usdPricesArgs?.addresses).toEqual([
      collateralAddress.toLowerCase(),
      debtAddress.toLowerCase(),
    ])
    expect(usdPricesArgs?.chainId).toBe(chainId)
  })

  it('combines loading flags from contracts and prices', () => {
    mockUseReadContracts.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
      error: undefined,
    })

    mockUseUsdPrices.mockReturnValueOnce({
      data: {},
      isLoading: false,
      isError: false,
      error: undefined,
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUsdPrice({ tokenAddress }),
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('surfaces errors from either source', () => {
    const contractError = new Error('contracts failed')

    mockUseReadContracts.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: contractError,
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUsdPrice({ tokenAddress }),
    )

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(contractError)
  })
})
