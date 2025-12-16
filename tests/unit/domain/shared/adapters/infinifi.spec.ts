import type { Address } from 'viem'
import { decodeFunctionData, getAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import infinifiGatewayAbi from '@/domain/shared/adapters/abi/infinifi/InfinifiGateway'
import unstakeAndRedeemHelperAbi from '@/domain/shared/adapters/abi/infinifi/UnstakeAndRedeemHelper'
import { DEFAULT_SLIPPAGE_BPS } from '@/domain/shared/adapters/helpers'
import { createInfinifiQuoteAdapter } from '@/domain/shared/adapters/infinifi'

const DEFAULT_ADDRESSES = {
  gateway: '0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5' as Address,
  unstakeAndRedeemHelper: '0x4f0122D43aB4893d5977FB0358B73CC178339dFE' as Address,
  siusd: '0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB' as Address,
}

const USDC: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const IUSD: Address = '0x48f9e38f3070AD8945DFEae3FA70987722E3D89c'
const MINT_CONTROLLER: Address = '0x1111111111111111111111111111111111111111'
const ROUTER: Address = '0x3333333333333333333333333333333333333333'

describe('createInfinifiQuoteAdapter', () => {
  let readContract: ReturnType<typeof vi.fn>
  let multicall: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    readContract = vi.fn()
    multicall = vi.fn().mockResolvedValue([USDC, MINT_CONTROLLER])
  })

  const createAdapter = (slippageBps: number = DEFAULT_SLIPPAGE_BPS) =>
    createInfinifiQuoteAdapter({
      publicClient: { readContract, multicall } as any,
      router: getAddress(ROUTER),
      chainId: mainnet.id,
      slippageBps,
    })

  it('quotes mintAndStake for USDC -> siUSD with slippage floor', async () => {
    multicall.mockResolvedValueOnce([USDC, MINT_CONTROLLER])
    readContract.mockResolvedValueOnce([5_000_000n, 4_000_000n]) // previewDepositFromAsset

    const adapter = createAdapter(100) // 1%
    const amountIn = 1_000_000n

    const quote = await adapter({
      inToken: USDC,
      outToken: DEFAULT_ADDRESSES.siusd,
      amountIn,
      intent: 'exactIn',
    })

    expect(quote.out).toBe(4_000_000n)
    expect(quote.minOut).toBe(3_960_000n) // 1% slippage floor applied
    expect(quote.approvalTarget).toBe(DEFAULT_ADDRESSES.gateway)
    expect(quote.calls).toHaveLength(1)

    const call = quote.calls[0]
    expect(call?.target).toBe(DEFAULT_ADDRESSES.gateway)
    expect(call?.value).toBe(0n)

    expect(multicall).toHaveBeenCalledWith(
      expect.objectContaining({
        allowFailure: false,
        contracts: [
          expect.objectContaining({
            address: DEFAULT_ADDRESSES.gateway,
            functionName: 'getAddress',
            args: ['USDC'],
          }),
          expect.objectContaining({
            address: DEFAULT_ADDRESSES.gateway,
            functionName: 'getAddress',
            args: ['mintController'],
          }),
        ],
      }),
    )

    const decoded = decodeFunctionData({
      abi: infinifiGatewayAbi,
      data: call?.data ?? '0x',
    })
    expect(decoded.functionName).toBe('mintAndStake')
    expect(decoded.args).toEqual([getAddress(ROUTER), amountIn])

    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'previewDepositFromAsset',
        args: [MINT_CONTROLLER, DEFAULT_ADDRESSES.siusd, amountIn],
        code: expect.any(String),
      }),
    )
  })

  it('quotes siUSD -> USDC redeem with helper call', async () => {
    multicall.mockResolvedValueOnce([USDC, MINT_CONTROLLER])
    readContract.mockResolvedValueOnce([6_000_000n, 5_700_000n]) // previewRedeemToAsset

    const adapter = createAdapter(200) // 2%
    const amountIn = 6_500_000n

    const quote = await adapter({
      inToken: DEFAULT_ADDRESSES.siusd,
      outToken: USDC,
      amountIn,
      intent: 'exactIn',
    })

    expect(quote.out).toBe(5_700_000n)
    expect(quote.minOut).toBe(5_586_000n)
    expect(quote.approvalTarget).toBe(DEFAULT_ADDRESSES.unstakeAndRedeemHelper)
    expect(quote.calls).toHaveLength(1)

    const [helperCall] = quote.calls

    const helperDecoded = decodeFunctionData({
      abi: unstakeAndRedeemHelperAbi,
      data: helperCall?.data ?? '0x',
    })
    expect(helperCall?.target).toBe(DEFAULT_ADDRESSES.unstakeAndRedeemHelper)
    expect(helperDecoded.functionName).toBe('unstakeAndRedeem')
    expect(helperDecoded.args).toEqual([amountIn])
  })

  it('rejects iUSD inputs or outputs', async () => {
    multicall.mockResolvedValueOnce([USDC, MINT_CONTROLLER])

    const adapter = createAdapter()

    await expect(
      adapter({
        inToken: IUSD,
        outToken: DEFAULT_ADDRESSES.siusd,
        amountIn: 1_000n,
        intent: 'exactIn',
      }),
    ).rejects.toThrow('Infinifi adapter only supports USDC <-> siUSD conversions')

    await expect(
      adapter({
        inToken: DEFAULT_ADDRESSES.siusd,
        outToken: IUSD,
        amountIn: 1_000n,
        intent: 'exactIn',
      }),
    ).rejects.toThrow('Infinifi adapter only supports USDC <-> siUSD conversions')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('throws on unsupported token pairs', async () => {
    multicall.mockResolvedValueOnce([USDC, MINT_CONTROLLER])

    const adapter = createAdapter()

    await expect(
      adapter({
        inToken: USDC,
        outToken: MINT_CONTROLLER, // arbitrary non-supported token
        amountIn: 1_000n,
        intent: 'exactIn',
      }),
    ).rejects.toThrow('Infinifi adapter only supports USDC <-> siUSD conversions')

    expect(readContract).not.toHaveBeenCalled()
  })

  it('throws on exactOut intent', async () => {
    multicall.mockResolvedValueOnce([USDC, MINT_CONTROLLER])

    const adapter = createAdapter()

    await expect(
      adapter({
        inToken: USDC,
        outToken: DEFAULT_ADDRESSES.siusd,
        amountOut: 1_000n,
        intent: 'exactOut',
      } as any),
    ).rejects.toThrow('Infinifi adapter does not support exactOut/withdraw')
  })
})
