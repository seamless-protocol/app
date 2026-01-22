import { buildSDK } from '@seamless-defi/defi-sdk'
import { createContext, useContext, useRef } from 'react'
import { type PublicClient, zeroAddress } from 'viem'
import { base } from 'viem/chains'
import { type UseClientReturnType, useClient } from 'wagmi'

type BalmySDKProviderProps = {
  children: React.ReactNode
}

type BalmySDKProviderState = {
  balmySDK: ReturnType<typeof buildSDK>
}

const BalmySDKProviderContext = createContext<BalmySDKProviderState | null>(null)

export function BalmySDKProvider({ children, ...props }: BalmySDKProviderProps) {
  const balmySDKRef = useRef<ReturnType<typeof buildSDK> | null>(null)
  const client = useClient()

  if (balmySDKRef.current === null) {
    balmySDKRef.current = createBalmySDK(client)
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

export const createBalmySDK = (client: UseClientReturnType | PublicClient) => {
  const liFiSourceDenylist = ['sushiswap', 'fly']
  if (client?.chain?.id === base.id) {
    liFiSourceDenylist.push('eisen', 'odos', 'okx')
  }

  return buildSDK({
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
    providers: {
      source: {
        type: 'custom',
        instance: client,
      },
    },
    prices: {
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
  })
}
