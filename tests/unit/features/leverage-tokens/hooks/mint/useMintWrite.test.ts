import type { Address, Hash } from 'viem'
import { base } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { useMintWrite } from '@/features/leverage-tokens/hooks/mint/useMintWrite'
import { getContractAddresses, isSupportedChain } from '@/lib/contracts/addresses'
import {
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'
import { hookTestUtils, makeAddr, makeTxnHash, mockSetup } from '../../../../../utils.tsx'

vi.mock('@/lib/contracts/generated', () => ({
  simulateLeverageRouterV2Deposit: vi.fn(),
  writeLeverageRouterV2Deposit: vi.fn(),
}))

const mockGetContractAddresses = getContractAddresses as unknown as ReturnType<typeof vi.fn>
const mockIsSupportedChain = isSupportedChain as unknown as ReturnType<typeof vi.fn>
const mockSimulateLeverageRouterV2Deposit =
  simulateLeverageRouterV2Deposit as unknown as ReturnType<typeof vi.fn>
const mockWriteLeverageRouterV2Deposit = writeLeverageRouterV2Deposit as unknown as ReturnType<
  typeof vi.fn
>

const MOCK_CONFIG = {} as Config
const CHAIN_ID = base.id
const TOKEN_ADDRESS: Address = makeAddr('token')
const ACCOUNT_ADDRESS: Address = makeAddr('account')
const MULTICALL_EXECUTOR: Address = makeAddr('executor')
const MOCK_HASH: Hash = makeTxnHash('mint-transaction')

const basePlan = {
  equityInCollateralAsset: 1000000000000000000n,
  minShares: 900000000000000000n,
  previewShares: 1000000000000000000n,
  expectedExcessDebt: 0n,
  flashLoanAmount: 1000000000000000000n,
  calls: [
    {
      target: makeAddr('swap'),
      value: 0n,
      data: '0xabcdef1234567890' as `0x${string}`,
    },
  ],
}

describe('useMintWrite', () => {
  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(ACCOUNT_ADDRESS, CHAIN_ID)

    mockGetContractAddresses.mockReturnValue({
      multicallExecutor: MULTICALL_EXECUTOR,
    })
    mockIsSupportedChain.mockReturnValue(true)
    mockSimulateLeverageRouterV2Deposit.mockResolvedValue({ request: { args: [] } } as never)
    mockWriteLeverageRouterV2Deposit.mockResolvedValue(MOCK_HASH)
  })

  it('returns mutate helpers', () => {
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintWrite())
    expect(result.current.mutate).toBeDefined()
    expect(result.current.mutateAsync).toBeDefined()
  })

  it('simulates and writes the transaction', async () => {
    const expectedArgs = [
      TOKEN_ADDRESS,
      basePlan.equityInCollateralAsset,
      basePlan.flashLoanAmount,
      basePlan.minShares,
      MULTICALL_EXECUTOR,
      basePlan.calls,
    ]
    mockSimulateLeverageRouterV2Deposit.mockResolvedValueOnce({
      request: { args: expectedArgs },
    } as never)

    const { result } = hookTestUtils.renderHookWithQuery(() => useMintWrite())
    const hash = await result.current.mutateAsync({
      config: MOCK_CONFIG,
      chainId: CHAIN_ID,
      account: ACCOUNT_ADDRESS,
      token: TOKEN_ADDRESS,
      plan: basePlan as any,
    })

    expect(hash).toBe(MOCK_HASH)
    expect(mockSimulateLeverageRouterV2Deposit).toHaveBeenCalledWith(MOCK_CONFIG, {
      args: expectedArgs,
      account: ACCOUNT_ADDRESS,
      chainId: CHAIN_ID,
    })
    expect(mockWriteLeverageRouterV2Deposit).toHaveBeenCalledWith(MOCK_CONFIG, {
      args: expectedArgs,
      account: ACCOUNT_ADDRESS,
      chainId: CHAIN_ID,
    })
  })

  it('throws when executor is missing', async () => {
    mockGetContractAddresses.mockReturnValueOnce({})
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintWrite())

    await expect(
      result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: CHAIN_ID,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: basePlan as any,
      }),
    ).rejects.toThrow('Multicall executor not found')
  })

  it('throws for unsupported chains', async () => {
    mockIsSupportedChain.mockReturnValueOnce(false)
    const { result } = hookTestUtils.renderHookWithQuery(() => useMintWrite())

    await expect(
      result.current.mutateAsync({
        config: MOCK_CONFIG,
        chainId: 1,
        account: ACCOUNT_ADDRESS,
        token: TOKEN_ADDRESS,
        plan: basePlan as any,
      }),
    ).rejects.toThrow(/Chain ID 1 not supported/)
  })
})
