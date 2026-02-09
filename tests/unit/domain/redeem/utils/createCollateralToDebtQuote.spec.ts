import type { buildSDK } from '@seamless-defi/defi-sdk'
import type { Address, PublicClient } from 'viem'
import { beforeAll, describe, expect, it, vi } from 'vitest'

type MockedBalmySDK = ReturnType<typeof buildSDK>

const ROUTER = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address
const EXECUTOR = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as Address

let actualCreateCollateralToDebtQuote: typeof import('@/domain/redeem/utils/createCollateralToDebtQuote')['createCollateralToDebtQuote']

beforeAll(async () => {
  const actual = await vi.importActual<
    typeof import('@/domain/redeem/utils/createCollateralToDebtQuote')
  >('@/domain/redeem/utils/createCollateralToDebtQuote')
  actualCreateCollateralToDebtQuote = actual.createCollateralToDebtQuote
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

describe('createCollateralToDebtQuote (balmy)', () => {
  it('passes the provided executor to the balmy adapter', async () => {
    const { getter } = createPublicClientGetter()
    const { balmySDK, getCapturedAddress } = createBalmySDKRecorder()

    const result = actualCreateCollateralToDebtQuote({
      chainId: 8453,
      routerAddress: ROUTER,
      swap: { type: 'balmy' },
      fromAddress: EXECUTOR,
      getPublicClient: getter,
      balmySDK,
    })

    expect(result).toBeDefined()
    const { quote, adapterType } = result

    await quote({
      inToken: ROUTER,
      outToken: ROUTER,
      amountIn: 1n,
      intent: 'exactIn',
      slippageBps: 75,
    })

    expect(adapterType).toBe('balmy')
    expect(getCapturedAddress()).toBe(EXECUTOR)
  })

  it('falls back to the router address when no executor is provided', async () => {
    const { getter } = createPublicClientGetter()
    const { balmySDK, getCapturedAddress } = createBalmySDKRecorder()

    const result = actualCreateCollateralToDebtQuote({
      chainId: 8453,
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
      slippageBps: 30,
    })

    expect(getCapturedAddress()).toBe(ROUTER)
  })
})
