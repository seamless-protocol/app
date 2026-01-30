import { base, mainnet } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'
import type { UseConfigReturnType } from 'wagmi'
import { getClient } from 'wagmi/actions'
import { createBalmySDK, getBalmySDKConfig } from '@/components/BalmySDKProvider'

vi.mock('wagmi/actions', () => ({
  getClient: vi.fn(),
}))

vi.unmock('@/components/BalmySDKProvider')

const mockWagmiConfig = {
  chains: [mainnet, base],
} as unknown as UseConfigReturnType

describe('createBalmySDK', () => {
  it('should create a Balmy SDK instance with custom config', () => {
    vi.mocked(getClient).mockImplementation(((_config: unknown, opts: { chainId: number }) => {
      const url = opts.chainId === 1 ? 'https://mainnet.example' : 'https://base.example'
      return {
        transport: {
          transports: [{ config: { retry: 3 }, value: { url } }],
        },
      }
    }) as typeof getClient)

    const expectedBalmyConfig = getBalmySDKConfig(mockWagmiConfig)

    const balmySDK = createBalmySDK(mockWagmiConfig)
    expect(balmySDK).toBeDefined()

    // ===== Quote config =====

    // @ts-expect-error - defaultConfig is not typed on IQuoteService
    expect(balmySDK.quoteService.defaultConfig.global).toEqual(
      expectedBalmyConfig.quotes.defaultConfig.global,
    )

    // @ts-expect-error - defaultConfig is not typed on IQuoteService
    expect(balmySDK.quoteService.defaultConfig.custom).toEqual(
      expectedBalmyConfig.quotes.defaultConfig.custom,
    )

    // ===== Provider config =====

    const providerServiceSupportedChains = balmySDK.providerService.supportedChains()
    expect(providerServiceSupportedChains).toEqual([mainnet.id, base.id])

    const providerServiceGetViemTransportMainnet = balmySDK.providerService.getViemTransport({
      chainId: mainnet.id,
    })
    const transportUrlMainnet = providerServiceGetViemTransportMainnet({ chain: mainnet as any })
      .value?.['transports'][0].value.url
    expect(transportUrlMainnet).toEqual('https://mainnet.example')

    const providerServiceGetViemTransportBase = balmySDK.providerService.getViemTransport({
      chainId: base.id,
    })
    const transportUrlBase = providerServiceGetViemTransportBase({ chain: base as any }).value?.[
      'transports'
    ][0].value.url
    expect(transportUrlBase).toEqual('https://base.example')

    // ===== Price config =====

    // @ts-expect-error - priceSource is not typed on IPriceService
    const priceSources = balmySDK.priceService.priceSource.sources
    expect(priceSources[0].constructor.name).toEqual('CoingeckoPriceSource')
    expect(priceSources[0].baseUrl).toEqual(
      // @ts-expect-error - baseUrl is not typed on IPriceSource
      expectedBalmyConfig.price.source.sources[0].baseUrl ?? 'https://api.coingecko.com',
    )

    expect(priceSources[1].constructor.name).toEqual('AlchemyPriceSource')
    // @ts-expect-error - apiKey is not typed on IPriceSource
    expect(priceSources[1].apiKey).toEqual(expectedBalmyConfig.price.source.sources[1].apiKey)

    expect(priceSources[2].constructor.name).toEqual('OdosPriceSource')
  })

  it('should create a Balmy SDK instance with custom provider config with no fallback transports array on client', () => {
    vi.mocked(getClient).mockImplementation(((_config: unknown, opts?: { chainId?: number }) => {
      const chainId = opts?.chainId ?? 1
      const url = chainId === 1 ? 'https://mainnet.example' : 'https://base.example'
      return { transport: { url } }
    }) as typeof getClient)

    const balmySDK = createBalmySDK(mockWagmiConfig)
    expect(balmySDK).toBeDefined()

    const providerServiceSupportedChains = balmySDK.providerService.supportedChains()
    expect(providerServiceSupportedChains).toEqual([mainnet.id, base.id])

    const providerServiceGetViemTransportMainnet = balmySDK.providerService.getViemTransport({
      chainId: mainnet.id,
    })
    const transportUrlMainnet = providerServiceGetViemTransportMainnet({ chain: mainnet as any })
      .value?.['transports'][0].value.url
    expect(transportUrlMainnet).toEqual('https://mainnet.example')

    const providerServiceGetViemTransportBase = balmySDK.providerService.getViemTransport({
      chainId: base.id,
    })
    const transportUrlBase = providerServiceGetViemTransportBase({ chain: base as any }).value?.[
      'transports'
    ][0].value.url
    expect(transportUrlBase).toEqual('https://base.example')
  })

  it('should throw an error if no transport URL is found for a chain', () => {
    vi.mocked(getClient).mockImplementation(
      () => ({ transport: {} }) as unknown as ReturnType<typeof getClient>,
    )

    expect(() => createBalmySDK(mockWagmiConfig)).toThrow('No transport URL found for chain 1')
  })
})
