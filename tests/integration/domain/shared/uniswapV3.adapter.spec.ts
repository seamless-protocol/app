import {
  type Address,
  createPublicClient,
  decodeFunctionData,
  http,
  parseUnits,
  type Address as ViemAddress,
} from 'viem'
import { describe, expect, it } from 'vitest'
import {
  createUniswapV3QuoteAdapter,
  type UniswapV3QuoteOptions,
} from '@/domain/shared/adapters/uniswapV3'
import { ADDR, CHAIN, RPC } from '../../../shared/env'

const hasV3Config = Boolean(
  ADDR.uniswapV3?.quoter &&
    ADDR.uniswapV3?.router &&
    ADDR.uniswapV3?.pool &&
    typeof ADDR.uniswapV3?.fee === 'number',
)
const describeIfV3 = hasV3Config ? describe : describe.skip

const POOL_ABI = [
  {
    type: 'function',
    name: 'token0',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'token1',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

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
  const client = createPublicClient({ chain: CHAIN, transport: http(RPC.primary) })

  const options: UniswapV3QuoteOptions = {
    publicClient: client as unknown as UniswapV3QuoteOptions['publicClient'],
    quoter: ADDR.uniswapV3?.quoter as Address,
    router: ADDR.uniswapV3?.router as Address,
    fee: (ADDR.uniswapV3?.fee ?? 0) as number,
    recipient: ADDR.uniswapV3?.router as Address,
    poolAddress: ADDR.uniswapV3?.pool as Address,
    wrappedNative: ADDR.weth,
  }

  const amountIn = parseUnits('1', 18)

  async function getPoolTokens(): Promise<{ token0: Address; token1: Address }> {
    const pool = ADDR.uniswapV3?.pool as ViemAddress
    const [token0, token1] = (await Promise.all([
      client.readContract({ address: pool, abi: POOL_ABI, functionName: 'token0' }),
      client.readContract({ address: pool, abi: POOL_ABI, functionName: 'token1' }),
    ])) as [Address, Address]
    return { token0, token1 }
  }

  it('quotes exact input swaps', async () => {
    const { token0, token1 } = await getPoolTokens()
    const adapter = createUniswapV3QuoteAdapter(options)
    const quote = await adapter({ inToken: token0, outToken: token1, amountIn, intent: 'exactIn' })

    expect(quote.out > 0n).toBe(true)
    expect(quote.approvalTarget).toEqual(options.router)

    const decoded = decodeFunctionData({ abi: SWAP_ROUTER_ABI, data: quote.calldata })
    expect(decoded.functionName).toBe('exactInputSingle')
  })

  it('quotes exact output swaps', async () => {
    const { token0, token1 } = await getPoolTokens()
    const adapter = createUniswapV3QuoteAdapter(options)
    const targetOut = parseUnits('0.5', 18)
    const quote = await adapter({
      inToken: token0,
      outToken: token1,
      amountOut: targetOut,
      intent: 'exactOut',
    })

    expect(quote.out).toBe(targetOut)
    expect(quote.approvalTarget).toEqual(options.router)

    const decoded = decodeFunctionData({ abi: SWAP_ROUTER_ABI, data: quote.calldata })
    expect(decoded.functionName).toBe('exactOutputSingle')
  })
})
