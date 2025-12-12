import type { Address } from 'viem'
import { decodeFunctionData, erc20Abi, getAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import infinifiGatewayAbi from '@/domain/shared/adapters/abi/infinifi/InfinifiGateway'
import { DEFAULT_SLIPPAGE_BPS } from '@/domain/shared/adapters/helpers'
import { createInfinifiQuoteAdapter } from '@/domain/shared/adapters/infinifi'

const DEFAULT_ADDRESSES = {
  gateway: '0x3f04b65Ddbd87f9CE0A2e7Eb24d80e7fb87625b5' as Address,
  iusd: '0x48f9e38f3070AD8945DFEae3FA70987722E3D89c' as Address,
  siusd: '0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB' as Address,
}

const USDC: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const MINT_CONTROLLER: Address = '0x1111111111111111111111111111111111111111'
const REDEEM_CONTROLLER: Address = '0x2222222222222222222222222222222222222222'
const ROUTER: Address = '0x3333333333333333333333333333333333333333'

describe('createInfinifiQuoteAdapter', () => {
  let readContract: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    readContract = vi.fn()
  })

  const createAdapter = (slippageBps: number = DEFAULT_SLIPPAGE_BPS) =>
    createInfinifiQuoteAdapter({
      publicClient: { readContract } as any,
      router: getAddress(ROUTER),
      chainId: mainnet.id,
      slippageBps,
    })

  it('quotes mintAndStake for USDC -> siUSD with slippage floor', async () => {
    readContract
      .mockResolvedValueOnce(USDC) // getAddress('USDC')
      .mockResolvedValueOnce(MINT_CONTROLLER) // getAddress('mintController')
      .mockResolvedValueOnce(REDEEM_CONTROLLER) // getAddress('redeemController')
      .mockResolvedValueOnce([5_000_000n, 4_000_000n]) // previewDepositFromAsset

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

    const decoded = decodeFunctionData({
      abi: infinifiGatewayAbi,
      data: call?.data ?? '0x',
    })
    expect(decoded.functionName).toBe('mintAndStake')
    expect(decoded.args).toEqual([getAddress(ROUTER), amountIn])

    expect(readContract).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        functionName: 'previewDepositFromAsset',
        args: [MINT_CONTROLLER, DEFAULT_ADDRESSES.siusd, amountIn],
      }),
    )
  })

  it('quotes stake for iUSD -> siUSD flow', async () => {
    readContract
      .mockResolvedValueOnce(USDC)
      .mockResolvedValueOnce(MINT_CONTROLLER)
      .mockResolvedValueOnce(REDEEM_CONTROLLER)
      .mockResolvedValueOnce(9_900_000n) // previewDeposit

    const adapter = createAdapter(50) // 0.5%
    const amountIn = 10_000_000n

    const quote = await adapter({
      inToken: DEFAULT_ADDRESSES.iusd,
      outToken: DEFAULT_ADDRESSES.siusd,
      amountIn,
      intent: 'exactIn',
    })

    expect(quote.out).toBe(9_900_000n)
    expect(quote.minOut).toBe(9_850_500n) // 0.5% floor
    expect(quote.approvalTarget).toBe(DEFAULT_ADDRESSES.gateway)

    const call = quote.calls[0]
    const decoded = decodeFunctionData({
      abi: infinifiGatewayAbi,
      data: call?.data ?? '0x',
    })
    expect(decoded.functionName).toBe('stake')
    expect(decoded.args).toEqual([getAddress(ROUTER), amountIn])
  })

  it('quotes siUSD -> iUSD redeem using previewRedeem', async () => {
    readContract
      .mockResolvedValueOnce(USDC)
      .mockResolvedValueOnce(MINT_CONTROLLER)
      .mockResolvedValueOnce(REDEEM_CONTROLLER)
      .mockResolvedValueOnce(7_500_000n) // previewRedeem

    const adapter = createAdapter(25) // 0.25%
    const amountIn = 8_000_000n

    const quote = await adapter({
      inToken: DEFAULT_ADDRESSES.siusd,
      outToken: DEFAULT_ADDRESSES.iusd,
      amountIn,
      intent: 'exactIn',
    })

    expect(quote.out).toBe(7_500_000n)
    expect(quote.minOut).toBe(7_481_250n)
    expect(quote.approvalTarget).toBe(DEFAULT_ADDRESSES.gateway)
    expect(quote.calls).toHaveLength(1)

    const decoded = decodeFunctionData({
      abi: infinifiGatewayAbi,
      data: quote.calls[0]?.data ?? '0x',
    })
    expect(decoded.functionName).toBe('unstake')
    expect(decoded.args).toEqual([getAddress(ROUTER), amountIn])
  })

  it('quotes siUSD -> USDC redeem with unstake + approve + redeem', async () => {
    readContract
      .mockResolvedValueOnce(USDC)
      .mockResolvedValueOnce(MINT_CONTROLLER)
      .mockResolvedValueOnce(REDEEM_CONTROLLER)
      .mockResolvedValueOnce([6_000_000n, 5_700_000n]) // previewRedeemToAsset

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
    expect(quote.approvalTarget).toBe(DEFAULT_ADDRESSES.gateway)
    expect(quote.calls).toHaveLength(3)

    const [unstakeCall, approveCall, redeemCall] = quote.calls

    const unstakeDecoded = decodeFunctionData({
      abi: infinifiGatewayAbi,
      data: unstakeCall?.data ?? '0x',
    })
    expect(unstakeCall?.target).toBe(DEFAULT_ADDRESSES.gateway)
    expect(unstakeDecoded.functionName).toBe('unstake')
    expect(unstakeDecoded.args).toEqual([getAddress(ROUTER), amountIn])

    const approveDecoded = decodeFunctionData({
      abi: erc20Abi,
      data: approveCall?.data ?? '0x',
    })
    expect(approveCall?.target).toBe(DEFAULT_ADDRESSES.iusd)
    expect(approveDecoded.functionName).toBe('approve')
    expect(approveDecoded.args).toEqual([DEFAULT_ADDRESSES.gateway, 6_000_000n])

    const redeemDecoded = decodeFunctionData({
      abi: infinifiGatewayAbi,
      data: redeemCall?.data ?? '0x',
    })
    expect(redeemCall?.target).toBe(DEFAULT_ADDRESSES.gateway)
    expect(redeemDecoded.functionName).toBe('redeem')
    expect(redeemDecoded.args).toEqual([getAddress(ROUTER), 6_000_000n, 5_586_000n])
  })

  it('throws on unsupported token pairs', async () => {
    readContract
      .mockResolvedValueOnce(USDC)
      .mockResolvedValueOnce(MINT_CONTROLLER)
      .mockResolvedValueOnce(REDEEM_CONTROLLER)

    const adapter = createAdapter()

    await expect(
      adapter({
        inToken: USDC,
        outToken: MINT_CONTROLLER, // arbitrary non-supported token
        amountIn: 1_000n,
        intent: 'exactIn',
      }),
    ).rejects.toThrow('Infinifi adapter only supports iUSD <-> siUSD conversions')
  })

  it('throws on exactOut intent', async () => {
    readContract
      .mockResolvedValueOnce(USDC)
      .mockResolvedValueOnce(MINT_CONTROLLER)
      .mockResolvedValueOnce(REDEEM_CONTROLLER)

    const adapter = createAdapter()

    await expect(
      adapter({
        inToken: DEFAULT_ADDRESSES.iusd,
        outToken: DEFAULT_ADDRESSES.siusd,
        amountOut: 1_000n,
        intent: 'exactOut',
      } as any),
    ).rejects.toThrow('Infinifi adapter does not support exactOut/withdraw')
  })
})
