import type { Address, PublicClient } from 'viem'
import {
  BaseError,
  decodeErrorResult,
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  RawContractError,
} from 'viem'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
import { BPS_DENOMINATOR, DEFAULT_SLIPPAGE_BPS } from './constants'
import type { QuoteFn } from './types'

type PublicClientLike = Pick<PublicClient, 'call' | 'getBlock' | 'readContract'>

type NormalizedPoolKey = {
  tokenIn: Address
  tokenOut: Address
  fee: number
}

export type UniswapV3QuoteOptions = {
  publicClient: PublicClientLike
  quoter?: Address
  router: Address
  fee: number
  recipient: Address
  poolAddress: Address
  wrappedNative?: Address
  slippageBps?: number
  deadlineSeconds?: number
}

const QUOTER_ABI = [
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'quoteExactInputSingle',
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'quoteExactOutputSingle',
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    outputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'QuoteExactInputSingle',
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'QuoteExactOutputSingle',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const

const SWAP_ROUTER_ABI = [
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'exactInputSingle',
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
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'exactOutputSingle',
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
    outputs: [{ name: 'amountIn', type: 'uint256' }],
  },
] as const

export function createUniswapV3QuoteAdapter(options: UniswapV3QuoteOptions): QuoteFn {
  const {
    publicClient,
    quoter,
    router,
    fee,
    recipient,
    wrappedNative,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    deadlineSeconds = 15 * 60,
  } = options

  if (slippageBps < 0 || slippageBps > Number(BPS_DENOMINATOR)) {
    throw new Error('Invalid slippage basis points')
  }

  return async ({ inToken, outToken, amountIn, amountOut: requiredOut, intent }) => {
    console.info('[v3 adapter] request', {
      inToken,
      outToken,
      amountIn: amountIn.toString(),
      requiredOut: requiredOut?.toString(),
      intent,
    })
    const { tokenIn, tokenOut } = normalizeTokens({
      inToken,
      outToken,
      ...(wrappedNative ? { wrappedNative } : {}),
    })
    const poolKey: NormalizedPoolKey = { tokenIn, tokenOut, fee }

    const block = await publicClient.getBlock()
    const deadline = block.timestamp + BigInt(deadlineSeconds)

    if (intent === 'exactOut') {
      const targetOut = requiredOut ?? amountIn
      if (targetOut <= 0n) throw new Error('Uniswap v3 exact-out requires positive amountOut')

      const requiredIn = await quoteExactOutputSingle({
        publicClient,
        ...(quoter ? { quoter } : {}),
        poolKey,
        amountOut: targetOut,
        poolAddress: options.poolAddress,
      })
      if (requiredIn <= 0n) throw new Error('Uniswap v3 quoter returned zero input for exact-out')

      const maxIn = applySlippageCeiling(requiredIn, slippageBps)
      const calldata = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactOutputSingle',
        args: [
          {
            tokenIn,
            tokenOut,
            fee,
            recipient,
            deadline,
            amountOut: targetOut,
            amountInMaximum: maxIn,
            sqrtPriceLimitX96: 0n,
          },
        ],
      })

      return {
        out: targetOut,
        minOut: targetOut,
        approvalTarget: getAddress(router),
        calldata,
        amountIn: requiredIn,
        maxIn,
      }
    }

    const amountOut = await quoteExactInputSingle({
      publicClient,
      ...(quoter ? { quoter } : {}),
      poolKey,
      amountIn,
      poolAddress: options.poolAddress,
    })
    if (amountOut <= 0n) throw new Error('Uniswap v3 quoter returned zero output')

    const minOut = applySlippageFloor(amountOut, slippageBps)
    const calldata = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn,
          tokenOut,
          fee,
          recipient,
          deadline,
          amountIn,
          amountOutMinimum: minOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
    })

    return {
      out: amountOut,
      minOut,
      approvalTarget: getAddress(router),
      calldata,
      amountIn,
    }
  }
}

async function quoteExactInputSingle(args: {
  publicClient: PublicClientLike
  quoter?: Address
  poolKey: NormalizedPoolKey
  amountIn: bigint
  poolAddress: Address
}): Promise<bigint> {
  const { publicClient, quoter, poolKey, amountIn, poolAddress } = args
  if (quoter) {
    const data = encodeFunctionData({
      abi: QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      args: [
        {
          tokenIn: poolKey.tokenIn,
          tokenOut: poolKey.tokenOut,
          amountIn,
          fee: poolKey.fee,
          sqrtPriceLimitX96: 0n,
        },
      ],
    })
    try {
      const { data: result } = await publicClient.call({ to: quoter, data })
      if (result && result !== '0x') {
        const [amountOut] = decodeFunctionResult({
          abi: QUOTER_ABI,
          functionName: 'quoteExactInputSingle',
          data: result,
        })
        return amountOut
      }
    } catch (error) {
      const decoded = decodeQuoteErrorOrNull(error, 'input')
      if (decoded !== null) return decoded
    }
  }
  return estimateExactInputSingle({ publicClient, poolKey, amountIn, poolAddress })
}

async function quoteExactOutputSingle(args: {
  publicClient: PublicClientLike
  quoter?: Address
  poolKey: NormalizedPoolKey
  amountOut: bigint
  poolAddress: Address
}): Promise<bigint> {
  const { publicClient, quoter, poolKey, amountOut, poolAddress } = args
  if (quoter) {
    const data = encodeFunctionData({
      abi: QUOTER_ABI,
      functionName: 'quoteExactOutputSingle',
      args: [
        {
          tokenIn: poolKey.tokenIn,
          tokenOut: poolKey.tokenOut,
          amountOut,
          fee: poolKey.fee,
          sqrtPriceLimitX96: 0n,
        },
      ],
    })
    try {
      const { data: result } = await publicClient.call({ to: quoter, data })
      if (result && result !== '0x') {
        const [amountIn] = decodeFunctionResult({
          abi: QUOTER_ABI,
          functionName: 'quoteExactOutputSingle',
          data: result,
        })
        return amountIn as bigint
      }
    } catch (error) {
      const decoded = decodeQuoteErrorOrNull(error, 'output')
      if (decoded !== null) return decoded
    }
  }
  return estimateExactOutputSingle({ publicClient, poolKey, amountOut, poolAddress })
}

function decodeQuoteErrorOrNull(error: unknown, type: 'input' | 'output'): bigint | null {
  const payload = extractRevertData(error)
  if (!payload) return null
  try {
    const decoded = decodeErrorResult({ abi: QUOTER_ABI, data: payload })
    if (type === 'input' && decoded.errorName === 'QuoteExactInputSingle') {
      const [amount] = decoded.args
      return amount as bigint
    }
    if (type === 'output' && decoded.errorName === 'QuoteExactOutputSingle') {
      const [amount] = decoded.args
      return amount as bigint
    }
  } catch {}
  return null
}

async function estimateExactInputSingle(args: {
  publicClient: PublicClientLike
  poolKey: NormalizedPoolKey
  amountIn: bigint
  poolAddress: Address
}): Promise<bigint> {
  const { publicClient, poolKey, amountIn, poolAddress } = args
  const state = await getPoolState(publicClient, poolAddress)
  const tokenInIsToken0 = isToken0(poolKey.tokenIn, poolKey.tokenOut)
  const amountAfterFee = applyFee(amountIn, poolKey.fee)
  if (tokenInIsToken0) {
    return mulDiv(amountAfterFee, state.priceX192, Q192)
  }
  return mulDiv(amountAfterFee, Q192, state.priceX192)
}

async function estimateExactOutputSingle(args: {
  publicClient: PublicClientLike
  poolKey: NormalizedPoolKey
  amountOut: bigint
  poolAddress: Address
}): Promise<bigint> {
  const { publicClient, poolKey, amountOut, poolAddress } = args
  const state = await getPoolState(publicClient, poolAddress)
  const tokenInIsToken0 = isToken0(poolKey.tokenIn, poolKey.tokenOut)
  const preFee = tokenInIsToken0
    ? mulDiv(amountOut, Q192, state.priceX192)
    : mulDiv(amountOut, state.priceX192, Q192)
  return applyFeeInverse(preFee, poolKey.fee)
}

async function getPoolState(publicClient: PublicClientLike, poolAddress: Address) {
  const slot0 = (await publicClient.readContract({
    address: poolAddress,
    abi: [
      {
        type: 'function',
        name: 'slot0',
        stateMutability: 'view',
        inputs: [],
        outputs: [
          { name: 'sqrtPriceX96', type: 'uint160' },
          { name: 'tick', type: 'int24' },
          { name: 'observationIndex', type: 'uint16' },
          { name: 'observationCardinality', type: 'uint16' },
          { name: 'observationCardinalityNext', type: 'uint16' },
          { name: 'feeProtocol', type: 'uint8' },
          { name: 'unlocked', type: 'bool' },
        ],
      },
    ],
    functionName: 'slot0',
  })) as unknown as [bigint, number, number, number, number, number, boolean]
  const sqrtPriceX96 = BigInt(slot0[0])
  const priceX192 = sqrtPriceX96 * sqrtPriceX96
  return { sqrtPriceX96, priceX192 }
}

function applyFee(amount: bigint, fee: number): bigint {
  const feeFactor = 1_000_000n - BigInt(fee)
  return (amount * feeFactor) / 1_000_000n
}

function applyFeeInverse(amount: bigint, fee: number): bigint {
  const feeFactor = 1_000_000n - BigInt(fee)
  return divCeil(amount * 1_000_000n, feeFactor)
}

function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
  return (a * b) / denominator
}

function divCeil(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator
}

function isToken0(tokenIn: Address, tokenOut: Address): boolean {
  return tokenIn.toLowerCase() < tokenOut.toLowerCase()
}

const Q96 = 2n ** 96n
const Q192 = Q96 * Q96

function extractRevertData(error: unknown): `0x${string}` | undefined {
  if (!(error instanceof BaseError)) return undefined
  const raw = error.walk((err) => err instanceof RawContractError) as RawContractError | null
  if (!raw) return undefined
  const { data } = raw
  if (!data) return undefined
  if (typeof data === 'string') return data as `0x${string}`
  return data.data as `0x${string}` | undefined
}

function normalizeTokens(args: { inToken: Address; outToken: Address; wrappedNative?: Address }): {
  tokenIn: Address
  tokenOut: Address
} {
  const { inToken, outToken, wrappedNative } = args
  const normalizedIn = normalizeToken(inToken, wrappedNative)
  const normalizedOut = normalizeToken(outToken, wrappedNative)
  return { tokenIn: normalizedIn, tokenOut: normalizedOut }
}

function normalizeToken(token: Address, wrappedNative?: Address): Address {
  if (token.toLowerCase() === ETH_SENTINEL.toLowerCase()) {
    if (!wrappedNative)
      throw new Error('Wrapped native token address required for ETH sentinel input')
    return getAddress(wrappedNative)
  }
  return getAddress(token)
}

function applySlippageFloor(amount: bigint, slippageBps: number): bigint {
  const slippage = BigInt(slippageBps)
  return (amount * (BPS_DENOMINATOR - slippage)) / BPS_DENOMINATOR
}

function applySlippageCeiling(amount: bigint, slippageBps: number): bigint {
  const slippage = BigInt(slippageBps)
  const numerator = amount * (BPS_DENOMINATOR + slippage)
  return (numerator + (BPS_DENOMINATOR - 1n)) / BPS_DENOMINATOR
}
