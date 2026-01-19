import { buildSDK } from '@seamless-defi/defi-sdk'
import { createContext, useContext, useRef } from 'react'
import { zeroAddress } from 'viem'
import { useClient } from 'wagmi'

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
    balmySDKRef.current = buildSDK({
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
              apiKey: import.meta.env['VITE_LIFI_API_KEY'] || undefined,
              baseUrl: 'https://partner-seashell.li.quest/v1/quote',
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
