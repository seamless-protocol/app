import { buildSDK } from '@seamless-defi/defi-sdk'
import { createContext, useContext, useRef } from 'react'
import { zeroAddress } from 'viem'
import { type UseConfigReturnType, useConfig } from 'wagmi'
import { getClient } from 'wagmi/actions'

type BalmySDKProviderProps = {
  children: React.ReactNode
}

type BalmySDKProviderState = {
  balmySDK: ReturnType<typeof buildSDK>
}

const BalmySDKProviderContext = createContext<BalmySDKProviderState | null>(null)

export function BalmySDKProvider({ children, ...props }: BalmySDKProviderProps) {
  const balmySDKRef = useRef<ReturnType<typeof buildSDK> | null>(null)
  const config = useConfig()

  if (balmySDKRef.current === null) {
    balmySDKRef.current = createBalmySDK(config)
  }

  return (
    <BalmySDKProviderContext.Provider {...props} value={{ balmySDK: balmySDKRef.current }}>
      {children}
    </BalmySDKProviderContext.Provider>
  )
}

export const useBalmySDK = () => {
  const context = useContext(BalmySDKProviderContext)

  if (context === null) throw new Error('useBalmySDK must be used within a BalmySDKProvider')

  return context
}

const getProviderFallbackSources = (config: UseConfigReturnType) => {
  const chains = config.chains.map((chain) => chain.id)

  const sources = []

  for (const chain of chains) {
    const client = getClient(config, { chainId: chain })
    if (!client) {
      throw new Error(`No client found for chain ${chain}`)
    }

    // If client uses fallback transports, use them
    const transports = client.transport?.['transports']

    if (transports) {
      for (const transport of transports) {
        sources.push({
          type: 'http',
          config: transport.config,
          supportedChains: [chain],
          url: transport.value.url,
        })
      }
    } else {
      const url = client.transport?.['url']
      if (!url) {
        throw new Error(`No transport URL found for chain ${chain}`)
      }
      sources.push({
        type: 'http',
        config: client.transport,
        supportedChains: [chain],
        url: url,
      })
    }
  }

  return sources
}

export const getBalmySDKConfig = (config: UseConfigReturnType) => {
  const liFiSourceDenylist = ['sushiswap', 'fly', 'kyberswap']

  return {
    quotes: {
      defaultConfig: {
        global: {
          referrer: {
            address: zeroAddress,
            name: 'seamless',
          },
        },
        custom: {
          'li-fi': {
            allowBridges: 'none',
            apiKey: import.meta.env['VITE_LIFI_API_KEY'] || undefined,
            baseUrl: 'https://partner-seashell.li.quest/v1/quote',
            order: 'CHEAPEST',
            sourceDenylist: liFiSourceDenylist,
          },
          kyberswap: {
            sourceDenylist: ['ekubo-v3'],
          },
        },
      },
      sourceList: { type: 'local' },
    },
    provider: {
      source: {
        type: 'fallback',
        sources: getProviderFallbackSources(config),
      },
    },
    price: {
      source: {
        type: 'prioritized',
        sources: [
          {
            type: 'coingecko',
            baseUrl: import.meta.env['VITE_COINGECKO_API_URL'] ?? undefined,
          },
          ...(import.meta.env['VITE_ALCHEMY_API_KEY'] !== ''
            ? [
                {
                  type: 'alchemy',
                  apiKey: import.meta.env['VITE_ALCHEMY_API_KEY'],
                },
              ]
            : []),
          {
            type: 'odos',
          },
        ],
      },
    },
  }
}

export const createBalmySDK = (config: UseConfigReturnType) => {
  // @ts-expect-error – bridging app viem Transport to defi-sdk viem Transport in provider config
  return buildSDK(getBalmySDKConfig(config))
}
