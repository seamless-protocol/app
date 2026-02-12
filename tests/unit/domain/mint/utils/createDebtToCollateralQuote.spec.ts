import type { buildSDK } from '@seamless-defi/defi-sdk'
import type { Address, PublicClient } from 'viem'
import { base } from 'viem/chains'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { contractAddresses } from '@/lib/contracts/addresses'

type MockedBalmySDK = ReturnType<typeof buildSDK>

const ROUTER = '0x1111111111111111111111111111111111111111' as Address
const CUSTOM_FROM = '0x2222222222222222222222222222222222222222' as Address

let actualCreateDebtToCollateralQuote: typeof import('@/domain/mint/utils/createDebtToCollateralQuote')['createDebtToCollateralQuote']

beforeAll(async () => {
  const actual = await vi.importActual<
    typeof import('@/domain/mint/utils/createDebtToCollateralQuote')
  >('@/domain/mint/utils/createDebtToCollateralQuote')
  actualCreateDebtToCollateralQuote = actual.createDebtToCollateralQuote
})

function createPublicClientGetter() {
  const client = {} as PublicClient
  const getter = vi.fn<(chainId: number) => PublicClient | undefined>().mockReturnValue(client)
  return { getter, client }
}

function createBalmySDKRecorder() {
  let capturedAddress: Address | undefined
  const balmySDK = {
    quoteService: {
      getBestQuote: vi.fn().mockImplementation((payload: any) => {
        capturedAddress = payload.request.takerAddress as Address
        return {
          source: { id: 'mock-source', allowanceTarget: ROUTER },
          buyAmount: { amount: 1n },
          minBuyAmount: { amount: 1n },
          maxSellAmount: { amount: 1n },
          sellAmount: { amount: 1n },
        }
      }),
      buildTxs: vi.fn().mockReturnValue({
        'mock-source': Promise.resolve({ data: '0x' }),
      }),
    },
  } as unknown as MockedBalmySDK

  return {
    balmySDK,
    getCapturedAddress: () => capturedAddress,
  }
}

describe('createDebtToCollateralQuote (balmy)', () => {
  it('uses the provided fromAddress when supplied', async () => {
    const { getter } = createPublicClientGetter()
    const { balmySDK, getCapturedAddress } = createBalmySDKRecorder()

    const result = actualCreateDebtToCollateralQuote({
      chainId: base.id,
      routerAddress: ROUTER,
      swap: { type: 'balmy' },
      getPublicClient: getter,
      fromAddress: CUSTOM_FROM,
      balmySDK,
    })

    expect(result).toBeDefined()
    const { quote, adapterType } = result

    await quote({
      inToken: ROUTER,
      outToken: ROUTER,
      amountIn: 1n,
      intent: 'exactIn',
      slippageBps: 25,
    })

    expect(adapterType).toBe('balmy')
    expect(getCapturedAddress()).toBe(CUSTOM_FROM)
  })

  it('defaults fromAddress to the chain multicall executor when available', async () => {
    const { getter } = createPublicClientGetter()
    const { balmySDK, getCapturedAddress } = createBalmySDKRecorder()
    const executor = contractAddresses[base.id]?.multicallExecutor as Address

    const result = actualCreateDebtToCollateralQuote({
      chainId: base.id,
      routerAddress: ROUTER,
      swap: { type: 'balmy' },
      getPublicClient: getter,
      balmySDK,
    })

    expect(result).toBeDefined()
    const { quote } = result

    await quote({
      inToken: ROUTER,
      outToken: ROUTER,
      amountIn: 1n,
      intent: 'exactIn',
      slippageBps: 50,
    })

    expect(getCapturedAddress()).toBe(executor)
  })

  it('falls back to the router address when no default executor exists', async () => {
    const { getter } = createPublicClientGetter()
    const { balmySDK, getCapturedAddress } = createBalmySDKRecorder()
    const unknownChainId = 999_999

    const result = actualCreateDebtToCollateralQuote({
      chainId: unknownChainId,
      routerAddress: ROUTER,
      swap: { type: 'balmy' },
      getPublicClient: getter,
      balmySDK,
    })

    expect(result).toBeDefined()
    const { quote } = result

    await quote({
      inToken: ROUTER,
      outToken: ROUTER,
      amountIn: 1n,
      intent: 'exactIn',
      slippageBps: 10,
    })

    expect(getCapturedAddress()).toBe(ROUTER)
  })
})
