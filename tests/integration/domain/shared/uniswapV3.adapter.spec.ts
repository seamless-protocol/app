import { type Address, createPublicClient, decodeFunctionData, http, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import {
  createUniswapV3QuoteAdapter,
  type UniswapV3QuoteOptions,
} from '@/domain/shared/adapters/uniswapV3'
import { ADDR, RPC, V3 } from '../../../shared/env'

const hasV3Config = Boolean(
  ADDR.v3Quoter && ADDR.v3SwapRouter && ADDR.v3Pool && typeof V3.poolFee === 'number',
)
const describeIfV3 = hasV3Config ? describe : describe.skip

const SWAP_ROUTER_ABI = [
  {
    type: 'function',
    name: 'exactInputSingle',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'exactOutputSingle',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'amountInMaximum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

describeIfV3('Uniswap v3 adapter (Tenderly)', () => {
  const client = createPublicClient({
    chain: {
      ...base,
      rpcUrls: {
        default: { http: [RPC.primary] },
        public: { http: [RPC.primary] },
      },
    },
    transport: http(RPC.primary),
  })

  const options: UniswapV3QuoteOptions = {
    publicClient: client as unknown as UniswapV3QuoteOptions['publicClient'],
    quoter: ADDR.v3Quoter as Address,
    router: ADDR.v3SwapRouter as Address,
    fee: (V3.poolFee ?? 0) as number,
    recipient: ADDR.v3SwapRouter as Address,
    poolAddress: ADDR.v3Pool as Address,
    wrappedNative: ADDR.weth,
  }

  const amountIn = parseUnits('1', 18)

  it('quotes exact input swaps', async () => {
    const adapter = createUniswapV3QuoteAdapter(options)
    const quote = await adapter({ inToken: ADDR.weeth, outToken: ADDR.weth, amountIn })

    expect(quote.out > 0n).toBe(true)
    expect(quote.approvalTarget).toEqual(options.router)

    const decoded = decodeFunctionData({ abi: SWAP_ROUTER_ABI, data: quote.calldata })
    expect(decoded.functionName).toBe('exactInputSingle')
  })

  it('quotes exact output swaps', async () => {
    const adapter = createUniswapV3QuoteAdapter(options)
    const targetOut = parseUnits('0.5', 18)
    const quote = await adapter({
      inToken: ADDR.weeth,
      outToken: ADDR.weth,
      amountIn: targetOut,
      intent: 'exactOut',
    })

    expect(quote.out).toBe(targetOut)
    expect(quote.approvalTarget).toEqual(options.router)

    const decoded = decodeFunctionData({ abi: SWAP_ROUTER_ABI, data: quote.calldata })
    expect(decoded.functionName).toBe('exactOutputSingle')
  })
})
