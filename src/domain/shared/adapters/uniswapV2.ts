import type { Address, PublicClient } from 'viem'
import { encodeFunctionData, getAddress } from 'viem'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
import { BPS_DENOMINATOR, DEFAULT_SLIPPAGE_BPS } from './constants'
import type { QuoteFn } from './types'

const UNISWAP_V2_ROUTER_ABI = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getAmountsOut',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'swapExactTokensForTokens',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'swapExactETHForTokens',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const

type ResolvePath = (args: { inToken: Address; outToken: Address }) => Array<Address>

export type UniswapV2QuoteOptions = {
  publicClient: PublicClientLike
  router: Address
  recipient: Address
  wrappedNative?: Address
  resolvePath?: ResolvePath
  slippageBps?: number
  deadlineSeconds?: number
}

type PublicClientLike = Pick<PublicClient, 'readContract' | 'getBlock'>

/**
 * Builds a QuoteFn using an on-chain UniswapV2-compatible router (Aerodrome, etc.).
 *
 * On forks this keeps swap sizing aligned with the manager preview without relying on
 * third-party aggregators. Supports both ERC-20 input and native (ETH) input paths.
 */
export function createUniswapV2QuoteAdapter(options: UniswapV2QuoteOptions): QuoteFn {
  const {
    publicClient,
    router,
    recipient,
    wrappedNative,
    resolvePath = ({ inToken, outToken }) => [inToken, outToken],
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    deadlineSeconds = 15 * 60,
  } = options

  const slippage = BigInt(slippageBps)
  const normalizedRouter = getAddress(router)

  return async ({ inToken, outToken, amountIn }) => {
    const isNativeIn = getAddress(inToken) === getAddress(ETH_SENTINEL)
    if (isNativeIn && !wrappedNative) {
      throw new Error(
        'createUniswapV2QuoteAdapter requires wrappedNative when using ETH sentinel input',
      )
    }
    const tokenIn = isNativeIn ? (wrappedNative as Address) : inToken

    const path = resolvePath({ inToken: getAddress(tokenIn), outToken: getAddress(outToken) })
    if (path.length < 2) throw new Error('UniswapV2 path must include at least two tokens')
    const pathWithMinimumLength = path as [Address, Address, ...Array<Address>]
    if (getAddress(pathWithMinimumLength[0]) !== getAddress(tokenIn)) {
      throw new Error('resolvePath must return a path that starts with the input token')
    }
    const lastPathTokenAddress = getAddress(
      pathWithMinimumLength.reduce((_, current) => current) as Address,
    )
    if (lastPathTokenAddress !== getAddress(outToken)) {
      throw new Error('resolvePath must return a path that ends with the output token')
    }

    const amountsOut = await publicClient.readContract({
      address: normalizedRouter,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountIn, path],
    })
    const out = amountsOut[amountsOut.length - 1]
    if (typeof out === 'undefined') throw new Error('UniswapV2 router returned no output amount')
    const minOut = (out * (BPS_DENOMINATOR - slippage)) / BPS_DENOMINATOR

    const block = await publicClient.getBlock()
    const deadline = block.timestamp + BigInt(deadlineSeconds)

    const calldata = isNativeIn
      ? encodeFunctionData({
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [minOut, path, getAddress(recipient), deadline],
        })
      : encodeFunctionData({
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [amountIn, minOut, path, getAddress(recipient), deadline],
        })

    return {
      out,
      minOut,
      approvalTarget: normalizedRouter,
      calldata,
      ...(isNativeIn ? { wantsNativeIn: true } : {}),
    }
  }
}
