import type { AnvilTestClient } from '@morpho-org/test'
import { createWrapper } from '@morpho-org/test-wagmi'
import type { QueryClient } from '@tanstack/react-query'
import {
  type Queries,
  type queries,
  type RenderHookOptions,
  renderHook as rtl_renderHook,
} from '@testing-library/react'
import type { Chain } from 'viem'
import { type Config, type Transport, WagmiProvider } from 'wagmi'
import { connect } from 'wagmi/actions'
import { BalmySDKProvider } from '@/components/BalmySDKProvider'

type TransportWithUrl = {
  url?: string
  value?: { url?: string }
}

/**
 * Connects wagmi’s mock connector to the local Anvil instance used by the test client.
 * - Repoints the wagmi chain RPC URLs to the Anvil RPC from the test client transport.
 * - Connects the selected mock connector so wagmi writeContract/sendTx calls hit Anvil.
 * - Without this, writeContract calls will fail
 */
export async function connectMockConnectorToAnvil({
  client,
  wagmiConfig,
  chainId = wagmiConfig.chains[0]?.id,
  connectorIndex = 0,
}: {
  client: AnvilTestClient
  wagmiConfig: Config
  chainId?: number
  connectorIndex?: number
}) {
  const transport = client.transport as TransportWithUrl
  const anvilRpcUrl = transport.url ?? transport.value?.url
  if (!anvilRpcUrl) {
    throw new Error('Anvil RPC URL not found on test client transport')
  }

  const chain = wagmiConfig.chains.find((item) => item.id === chainId) ?? wagmiConfig.chains[0]
  if (!chain) {
    throw new Error('No chains configured in wagmiConfig')
  }
  // Ensure writeContract routes to the local Anvil node
  ;(
    chain as unknown as {
      rpcUrls: { default: { http: Array<string> }; public: { http: Array<string> } }
    }
  ).rpcUrls.default.http = [anvilRpcUrl]
  ;(
    chain as unknown as {
      rpcUrls: { default: { http: Array<string> }; public: { http: Array<string> } }
    }
  ).rpcUrls.public = (
    chain as unknown as {
      rpcUrls: { default: { http: Array<string> }; public: { http: Array<string> } }
    }
  ).rpcUrls.default

  const connector = wagmiConfig.connectors[connectorIndex]
  if (!connector) {
    throw new Error('No test connector found')
  }

  await connect(wagmiConfig, {
    connector,
    chainId: chain.id,
  })
}

// Copied from @morpho-org/test-wagmi, but modified to include BalmySDKProvider on the wrapper
export function renderHook<
  Result,
  Props,
  Q extends Queries = typeof queries,
  chains extends readonly [Chain, ...Array<Chain>] = readonly [Chain, ...Array<Chain>],
  transports extends Record<chains[number]['id'], Transport> = Record<
    chains[number]['id'],
    Transport
  >,
>(
  config: Config<chains, transports>,
  render: (props: Props) => Result,
  options?: RenderHookOptions<Props, Q> & { queryClient?: QueryClient },
) {
  options?.queryClient?.clear()

  // Wrapper that includes WagmiProvider and QueryClient using the test wagmi config
  const wagmiWrapper = createWrapper(
    WagmiProvider,
    {
      config,
      reconnectOnMount: false,
    },
    options?.queryClient,
  )

  // This wrapper adds Balmy on top of the default
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    wagmiWrapper({ children: <BalmySDKProvider>{children}</BalmySDKProvider> })

  return rtl_renderHook(render, {
    wrapper,
    ...options,
  })
}
