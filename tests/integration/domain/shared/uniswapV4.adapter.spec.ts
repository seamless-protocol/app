import {
  type Address,
  createPublicClient,
  decodeAbiParameters,
  decodeFunctionData,
  type Hex,
  http,
  parseUnits,
} from 'viem'
import { base } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import type { UniswapV4QuoteOptions } from '@/domain/shared/adapters/uniswapV4'
import { createUniswapV4QuoteAdapter } from '@/domain/shared/adapters/uniswapV4'
import { ADDR, RPC, V4 } from '../../../shared/env'

const hasV4Addresses = Boolean(ADDR.quoterV4 && ADDR.universalRouterV4 && RPC.primary)
const describeIfV4 = hasV4Addresses ? describe : describe.skip

describeIfV4('Uniswap v4 adapter (Tenderly)', () => {
  const chain = {
    ...base,
    rpcUrls: {
      default: { http: [RPC.primary] },
      public: { http: [RPC.primary] },
    },
  }

  const viemClient = createPublicClient({
    chain,
    transport: http(RPC.primary),
  })

  const options: UniswapV4QuoteOptions = {
    publicClient: viemClient as unknown as UniswapV4QuoteOptions['publicClient'],
    quoter: ADDR.quoterV4 as Address,
    universalRouter: ADDR.universalRouterV4 as Address,
    poolKey: {
      currency0: ADDR.weth as Address,
      currency1: ADDR.usdc as Address,
      fee: V4.poolFee ?? 500,
      tickSpacing: V4.tickSpacing ?? 10,
      hooks:
        (ADDR.v4Hooks as Address | undefined) ??
        ('0x0000000000000000000000000000000000000000' as Address),
    },
  }

  it('quotes against live quoter and encodes commands', async () => {
    const adapter = createUniswapV4QuoteAdapter(options)
    const amountIn = parseUnits('0.1', 18)
    const quote = await adapter({
      inToken: options.poolKey.currency0,
      outToken: options.poolKey.currency1,
      amountIn,
    })

    expect(quote.out).toBeGreaterThan(0n)
    expect(quote.approvalTarget).toEqual(options.universalRouter)

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

    expect(actions).toBe('0x060c0f')
    expect(params.length).toBe(3)
  })

  it('supports exact-out intent', async () => {
    const adapter = createUniswapV4QuoteAdapter(options)
    const targetOut = parseUnits('10', 6) // 10 USDC
    const quote = await adapter({
      inToken: options.poolKey.currency0,
      outToken: options.poolKey.currency1,
      amountIn: targetOut,
      intent: 'exactOut',
    })

    expect(quote.out).toBe(targetOut)
    expect(quote.approvalTarget).toEqual(options.universalRouter)

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
  })
})
