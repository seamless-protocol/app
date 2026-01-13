import type { AnvilTestClient } from '@morpho-org/test'
import type { Config } from 'wagmi'
import { connect } from 'wagmi/actions'

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
