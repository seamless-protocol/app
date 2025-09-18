import type { Address, Hex } from 'viem'
import {
  decodeAbiParameters,
  decodeFunctionData,
  encodeErrorResult,
  encodeFunctionResult,
  RawContractError,
} from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { UniswapV4QuoteOptions } from '@/domain/shared/adapters/uniswapV4'
import { createUniswapV4QuoteAdapter } from '@/domain/shared/adapters/uniswapV4'

const QUOTER = '0x1000000000000000000000000000000000000000' as Address
const UNIVERSAL_ROUTER = '0x2000000000000000000000000000000000000000' as Address
const TOKEN_A = '0x3000000000000000000000000000000000000000' as Address
const TOKEN_B = '0x4000000000000000000000000000000000000000' as Address

function buildAdapter(overrides: Partial<UniswapV4QuoteOptions> = {}) {
  const call = vi.fn()
  const getBlock = vi.fn().mockResolvedValue({ timestamp: 1_000n })
  const publicClient = { call, getBlock }
  const options: UniswapV4QuoteOptions = {
    publicClient: publicClient as any,
    quoter: QUOTER,
    universalRouter: UNIVERSAL_ROUTER,
    poolKey: {
      currency0: TOKEN_A,
      currency1: TOKEN_B,
      fee: 500,
      tickSpacing: 10,
      hooks: '0x0000000000000000000000000000000000000000',
    },
    ...overrides,
  }
  const adapter = createUniswapV4QuoteAdapter(options)
  return { adapter, publicClient }
}

describe('createUniswapV4QuoteAdapter', () => {
  it('encodes universal router payload with quoted amounts', async () => {
    const amountOut = 1_234_000n
    const { adapter, publicClient } = buildAdapter()
    const data = encodeFunctionResult({
      abi: [
        {
          type: 'function',
          stateMutability: 'nonpayable',
          name: 'quoteExactInputSingle',
          inputs: [
            {
              name: 'params',
              type: 'tuple',
              components: [],
            },
          ],
          outputs: [
            { name: 'amountOut', type: 'uint256' },
            { name: 'gasEstimate', type: 'uint256' },
          ],
        },
      ],
      functionName: 'quoteExactInputSingle',
      result: [amountOut, 0n],
    })
    ;(publicClient.call as any).mockResolvedValueOnce({ data })

    const quote = await adapter({ inToken: TOKEN_A, outToken: TOKEN_B, amountIn: 1_000_000n })

    expect(quote.out).toBe(amountOut)
    const expectedMin = amountOut - (amountOut * 50n) / 10_000n
    expect(quote.minOut).toBe(expectedMin)
    expect(quote.approvalTarget).toBe(UNIVERSAL_ROUTER)

    const decoded = decodeFunctionData({
      abi: [
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
      ],
      data: quote.calldata,
    })

    expect(decoded.functionName).toBe('execute')
    expect(decoded.args?.[0]).toBe('0x10')
    expect((decoded.args?.[1] as Array<Hex>).length).toBe(1)
    expect(decoded.args?.[2]).toBe(1_000n + 900n)

    const unlockData = (decoded.args?.[1] as Array<Hex>)[0] as Hex
    const [actions, params] = decodeAbiParameters(
      [{ type: 'bytes' }, { type: 'bytes[]' }],
      unlockData,
    )

    expect(actions).toBe('0x060c0f')
    expect(params.length).toBe(3)
    expect(publicClient.call).toHaveBeenCalledWith({ to: QUOTER, data: expect.any(String) })
  })

  it('parses QuoteSwap revert payloads', async () => {
    const amountOut = 888_000n
    const revertData = encodeErrorResult({
      abi: [
        {
          type: 'error',
          name: 'QuoteSwap',
          inputs: [{ name: 'amount', type: 'uint256' }],
        },
      ],
      errorName: 'QuoteSwap',
      args: [amountOut],
    })

    const { adapter, publicClient } = buildAdapter()
    ;(publicClient.call as any).mockRejectedValueOnce(new RawContractError({ data: revertData }))

    const quote = await adapter({ inToken: TOKEN_A, outToken: TOKEN_B, amountIn: 1_000n })
    expect(quote.out).toBe(amountOut)
  })

  it('throws on mismatched pool tokens', async () => {
    const { adapter } = buildAdapter()
    await expect(adapter({ inToken: TOKEN_A, outToken: TOKEN_A, amountIn: 1n })).rejects.toThrow(
      /does not match configured Uniswap v4 pool key/,
    )
  })

  it('supports exact-out intent with slippage ceiling', async () => {
    const requiredIn = 1_500_000n
    const targetOut = 1_000_000n
    const { adapter, publicClient } = buildAdapter()
    const data = encodeFunctionResult({
      abi: [
        {
          type: 'function',
          stateMutability: 'nonpayable',
          name: 'quoteExactOutputSingle',
          inputs: [
            {
              name: 'params',
              type: 'tuple',
              components: [],
            },
          ],
          outputs: [
            { name: 'amountIn', type: 'uint256' },
            { name: 'gasEstimate', type: 'uint256' },
          ],
        },
      ],
      functionName: 'quoteExactOutputSingle',
      result: [requiredIn, 0n],
    })
    ;(publicClient.call as any).mockResolvedValueOnce({ data })

    const quote = await adapter({
      inToken: TOKEN_A,
      outToken: TOKEN_B,
      amountIn: targetOut,
      intent: 'exactOut',
    })

    expect(quote.out).toBe(targetOut)
    expect(quote.minOut).toBe(targetOut)

    const decoded = decodeFunctionData({
      abi: [
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
      ],
      data: quote.calldata,
    })

    expect(decoded.functionName).toBe('execute')
    expect(decoded.args?.[0]).toBe('0x10')

    const unlockData = (decoded.args?.[1] as Array<Hex>)[0] as Hex
    const [actions, params] = decodeAbiParameters(
      [{ type: 'bytes' }, { type: 'bytes[]' }],
      unlockData,
    )

    expect(actions).toBe('0x080c0f')
    expect(params.length).toBe(3)

    const expectedMaxIn = (requiredIn * (10_000n + 50n) + (10_000n - 1n)) / 10_000n

    const settleArgs = decodeAbiParameters(
      [{ type: 'address' }, { type: 'uint256' }],
      params[1] as Hex,
    )
    expect(settleArgs[1]).toBe(expectedMaxIn)
  })
})
