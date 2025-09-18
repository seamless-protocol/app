import type { Address, Hex, PublicClient } from 'viem'
import {
  BaseError,
  decodeErrorResult,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  RawContractError,
} from 'viem'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
import { BPS_DENOMINATOR, DEFAULT_SLIPPAGE_BPS } from './constants'
import type { QuoteFn } from './types'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

const V4_QUOTER_ABI = [
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'quoteExactInputSingle',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'poolKey',
            type: 'tuple',
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' },
            ],
          },
          { name: 'zeroForOne', type: 'bool' },
          { name: 'exactAmount', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'quoteExactOutputSingle',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'poolKey',
            type: 'tuple',
            components: [
              { name: 'currency0', type: 'address' },
              { name: 'currency1', type: 'address' },
              { name: 'fee', type: 'uint24' },
              { name: 'tickSpacing', type: 'int24' },
              { name: 'hooks', type: 'address' },
            ],
          },
          { name: 'zeroForOne', type: 'bool' },
          { name: 'exactAmount', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'QuoteSwap',
    inputs: [{ name: 'amount', type: 'uint256' }],
  },
] as const

const UNIVERSAL_ROUTER_ABI = [
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'execute',
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

const V4_ACTIONS = {
  SWAP_EXACT_IN_SINGLE: 0x06,
  SWAP_EXACT_OUT_SINGLE: 0x08,
  SETTLE_ALL: 0x0c,
  TAKE_ALL: 0x0f,
} as const

const UNIVERSAL_COMMANDS = {
  V4_SWAP: 0x10,
} as const

const ACTIONS_PARAM_TYPES = {
  exactInputSingle: [
    {
      type: 'tuple',
      components: [
        {
          name: 'poolKey',
          type: 'tuple',
          components: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' },
          ],
        },
        { name: 'zeroForOne', type: 'bool' },
        { name: 'amountIn', type: 'uint128' },
        { name: 'amountOutMinimum', type: 'uint128' },
        { name: 'hookData', type: 'bytes' },
      ],
    },
  ] as const,
  exactOutputSingle: [
    {
      type: 'tuple',
      components: [
        {
          name: 'poolKey',
          type: 'tuple',
          components: [
            { name: 'currency0', type: 'address' },
            { name: 'currency1', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'hooks', type: 'address' },
          ],
        },
        { name: 'zeroForOne', type: 'bool' },
        { name: 'amountOut', type: 'uint128' },
        { name: 'amountInMaximum', type: 'uint128' },
        { name: 'hookData', type: 'bytes' },
      ],
    },
  ] as const,
  settleAll: [{ type: 'address' }, { type: 'uint256' }] as const,
  takeAll: [{ type: 'address' }, { type: 'uint256' }] as const,
} as const

type PublicClientLike = Pick<PublicClient, 'call' | 'getBlock'>

type PoolKeyConfig = {
  currency0: Address
  currency1: Address
  fee: number
  tickSpacing: number
  hooks: Address
}

export type UniswapV4QuoteOptions = {
  publicClient: PublicClientLike
  quoter: Address
  universalRouter: Address
  poolKey: PoolKeyConfig
  hookData?: Hex
  slippageBps?: number
  deadlineSeconds?: number
}

function normalizeCurrency(address: Address): Address {
  if (address.toLowerCase() === ETH_SENTINEL.toLowerCase()) return ZERO_ADDRESS
  if (address.toLowerCase() === ZERO_ADDRESS.toLowerCase()) return ZERO_ADDRESS
  return getAddress(address)
}

function encodeActionsByteString(actions: Array<number>): Hex {
  return ('0x' +
    actions
      .map((value) => {
        if (value < 0 || value > 0xff) throw new Error('Action opcode out of range')
        return value.toString(16).padStart(2, '0')
      })
      .join('')) as Hex
}

async function quoteExactInputSingle(params: {
  publicClient: PublicClientLike
  quoter: Address
  poolKey: PoolKeyConfig
  zeroForOne: boolean
  amountIn: bigint
  hookData: Hex
}): Promise<bigint> {
  const { publicClient, quoter, poolKey, zeroForOne, amountIn, hookData } = params

  const data = encodeFunctionData({
    abi: V4_QUOTER_ABI,
    functionName: 'quoteExactInputSingle',
    args: [
      {
        poolKey,
        zeroForOne,
        exactAmount: amountIn,
        hookData,
      },
    ],
  })

  try {
    const { data: response } = await publicClient.call({ to: quoter, data })
    if (!response || response === '0x') {
      throw new Error('Uniswap v4 quoter returned empty data')
    }
    const [amountOut] = decodeFunctionResult({
      abi: V4_QUOTER_ABI,
      functionName: 'quoteExactInputSingle',
      data: response,
    })
    return amountOut
  } catch (error) {
    const revertData = extractRevertErrorData(error)
    if (!revertData) throw error
    const decoded = decodeErrorResult({ abi: V4_QUOTER_ABI, data: revertData })
    if (decoded.errorName !== 'QuoteSwap') throw error
    const [amount] = decoded.args
    return amount as bigint
  }
}

async function quoteExactOutputSingle(params: {
  publicClient: PublicClientLike
  quoter: Address
  poolKey: PoolKeyConfig
  zeroForOne: boolean
  amountOut: bigint
  hookData: Hex
}): Promise<bigint> {
  const { publicClient, quoter, poolKey, zeroForOne, amountOut, hookData } = params

  const data = encodeFunctionData({
    abi: V4_QUOTER_ABI,
    functionName: 'quoteExactOutputSingle',
    args: [
      {
        poolKey,
        zeroForOne,
        exactAmount: amountOut,
        hookData,
      },
    ],
  })

  try {
    const { data: response } = await publicClient.call({ to: quoter, data })
    if (!response || response === '0x') {
      throw new Error('Uniswap v4 quoter returned empty data')
    }
    const [amountIn] = decodeFunctionResult({
      abi: V4_QUOTER_ABI,
      functionName: 'quoteExactOutputSingle',
      data: response,
    })
    return amountIn
  } catch (error) {
    const revertData = extractRevertErrorData(error)
    if (!revertData) throw error
    const decoded = decodeErrorResult({ abi: V4_QUOTER_ABI, data: revertData })
    if (decoded.errorName !== 'QuoteSwap') throw error
    const [amount] = decoded.args
    return amount as bigint
  }
}

function extractRevertErrorData(error: unknown): Hex | undefined {
  if (!(error instanceof BaseError)) return undefined
  const raw = error.walk((err) => err instanceof RawContractError) as RawContractError | null
  if (!raw) return undefined
  const payload = raw.data
  if (!payload) return undefined
  if (typeof payload === 'string') return payload as Hex
  return payload.data as Hex | undefined
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

export function createUniswapV4QuoteAdapter(options: UniswapV4QuoteOptions): QuoteFn {
  const {
    publicClient,
    quoter,
    universalRouter,
    poolKey,
    hookData = '0x',
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    deadlineSeconds = 15 * 60,
  } = options

  if (slippageBps < 0 || slippageBps > Number(BPS_DENOMINATOR)) {
    throw new Error('Invalid slippage basis points')
  }

  const normalizedPoolKey: PoolKeyConfig = {
    currency0: normalizeCurrency(poolKey.currency0),
    currency1: normalizeCurrency(poolKey.currency1),
    fee: poolKey.fee,
    tickSpacing: poolKey.tickSpacing,
    hooks: getAddress(poolKey.hooks),
  }

  return async ({ inToken, outToken, amountIn, amountOut: amountOutValue, intent }) => {
    const inCurrency = normalizeCurrency(inToken)
    const outCurrency = normalizeCurrency(outToken)

    const zeroForOne = (() => {
      if (inCurrency === normalizedPoolKey.currency0 && outCurrency === normalizedPoolKey.currency1)
        return true
      if (inCurrency === normalizedPoolKey.currency1 && outCurrency === normalizedPoolKey.currency0)
        return false
      throw new Error('Requested token pair does not match configured Uniswap v4 pool key')
    })()

    const block = await publicClient.getBlock()
    const deadline = block.timestamp + BigInt(deadlineSeconds)

    if (intent === 'exactOut') {
      const targetOut = amountOutValue ?? amountIn
      if (targetOut <= 0n) {
        throw new Error('Uniswap v4 exact-out mode requires positive amountOut')
      }

      const requiredIn = await quoteExactOutputSingle({
        publicClient,
        quoter,
        poolKey: normalizedPoolKey,
        zeroForOne,
        amountOut: targetOut,
        hookData,
      })

      if (requiredIn <= 0n) {
        throw new Error('Uniswap v4 quoter returned zero input for exact-out quote')
      }

      const maxIn = applySlippageCeiling(requiredIn, slippageBps)

      const swapParams = encodeAbiParameters(ACTIONS_PARAM_TYPES.exactOutputSingle, [
        {
          poolKey: normalizedPoolKey,
          zeroForOne,
          amountOut: targetOut,
          amountInMaximum: maxIn,
          hookData,
        },
      ])

      const settleParams = encodeAbiParameters(ACTIONS_PARAM_TYPES.settleAll, [inCurrency, maxIn])
      const takeParams = encodeAbiParameters(ACTIONS_PARAM_TYPES.takeAll, [outCurrency, targetOut])

      const actions = encodeActionsByteString([
        V4_ACTIONS.SWAP_EXACT_OUT_SINGLE,
        V4_ACTIONS.SETTLE_ALL,
        V4_ACTIONS.TAKE_ALL,
      ])

      const unlockData = encodeAbiParameters(
        [{ type: 'bytes' }, { type: 'bytes[]' }],
        [actions, [swapParams, settleParams, takeParams]],
      )

      const commands = encodeActionsByteString([UNIVERSAL_COMMANDS.V4_SWAP])
      const calldata = encodeFunctionData({
        abi: UNIVERSAL_ROUTER_ABI,
        functionName: 'execute',
        args: [commands, [unlockData], deadline],
      })

      return {
        out: targetOut,
        minOut: targetOut,
        deadline,
        approvalTarget: getAddress(universalRouter),
        calldata,
      }
    }

    const amountOut = await quoteExactInputSingle({
      publicClient,
      quoter,
      poolKey: normalizedPoolKey,
      zeroForOne,
      amountIn,
      hookData,
    })

    if (amountOut <= 0n) {
      throw new Error('Uniswap v4 quoter returned zero output')
    }

    const minOut = applySlippageFloor(amountOut, slippageBps)

    const swapParams = encodeAbiParameters(ACTIONS_PARAM_TYPES.exactInputSingle, [
      {
        poolKey: normalizedPoolKey,
        zeroForOne,
        amountIn,
        amountOutMinimum: minOut,
        hookData,
      },
    ])

    const settleParams = encodeAbiParameters(ACTIONS_PARAM_TYPES.settleAll, [inCurrency, amountIn])
    const takeParams = encodeAbiParameters(ACTIONS_PARAM_TYPES.takeAll, [outCurrency, minOut])

    const actions = encodeActionsByteString([
      V4_ACTIONS.SWAP_EXACT_IN_SINGLE,
      V4_ACTIONS.SETTLE_ALL,
      V4_ACTIONS.TAKE_ALL,
    ])

    const unlockData = encodeAbiParameters(
      [{ type: 'bytes' }, { type: 'bytes[]' }],
      [actions, [swapParams, settleParams, takeParams]],
    )

    const commands = encodeActionsByteString([UNIVERSAL_COMMANDS.V4_SWAP])
    const calldata = encodeFunctionData({
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: 'execute',
      args: [commands, [unlockData], deadline],
    })

    return {
      out: amountOut,
      minOut,
      deadline,
      approvalTarget: getAddress(universalRouter),
      calldata,
    }
  }
}
