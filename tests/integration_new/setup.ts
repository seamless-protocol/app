import type { AnvilTestClient } from '@morpho-org/test'
import { createWagmiTest } from '@morpho-org/test-wagmi'
import { Request } from 'undici'
import type { Chain, HttpTransport } from 'viem'
import { base, mainnet } from 'viem/chains'
import { beforeEach, type TestAPI, vi } from 'vitest'
import { type Config, http } from 'wagmi'
import { connectMockConnectorToAnvil } from './helpers/wagmi'
import { basePublicClient, mainnetPublicClient } from './utils'

// Mock TanStack Router hooks
vi.mock('@tanstack/react-router', () => ({
  useLocation: vi.fn(() => ({
    pathname: '/',
    search: {},
    hash: '',
    state: {},
    key: 'default',
  })),
}))

export type WagmiChainTestAPI<chain extends Chain = Chain> = TestAPI<{
  client: AnvilTestClient<chain>
  config: Config<readonly [chain], Record<chain['id'], HttpTransport>>
}>

// Vitest is overriding the AbortController and AbortSignal globals from jsdom and Node 24's native fetch (undici) does not
// work with jsdom's AbortSignal implementation.
// Without this assignment, some blockchain test actions (such as RPC calls to Anvil)
// will throw an error like:
//   "Failed to construct 'Request': signal is not of type AbortSignal."
// This occurs because Viem expects the global Request implementation to match browser standards.
// By assigning undici's Request to globalThis.Request, we ensure Node.js tests use the correct implementation.
// Note: This has been fixed in vitest but not yet released in a stable version.
globalThis.Request = Request as unknown as typeof globalThis.Request

const CHAIN_PORTS: Record<number, number> = {
  [mainnet.id]: 8545,
  [base.id]: 8546,
}

const mainnetTestBase = createWagmiTest(mainnet, {
  forkBlockNumber: await mainnetPublicClient.getBlockNumber(),
  forkUrl: import.meta.env['VITE_ETHEREUM_FORK_RPC_URL'],
  port: CHAIN_PORTS[mainnet.id],
})
export const mainnetTest: WagmiChainTestAPI<typeof mainnet> = withConnectedMockConnector(
  mainnetTestBase,
  mainnet.id,
)

const baseTestBase = createWagmiTest(base, {
  forkBlockNumber: await basePublicClient.getBlockNumber(),
  forkUrl: import.meta.env['VITE_BASE_FORK_RPC_URL'],
  port: CHAIN_PORTS[base.id],
})
export const baseTest: WagmiChainTestAPI<typeof base> = withConnectedMockConnector(
  baseTestBase,
  base.id,
)

export const wagmiTest = (chainId: number): typeof mainnetTest =>
  (chainId === mainnet.id ? mainnetTest : baseTest) as typeof mainnetTest

/**
 * Connects wagmi’s mock connector to the local Anvil instance used by the test client.
 * - Repoints the wagmi chain RPC URLs to the Anvil RPC from the test client transport.
 * - Connects the selected mock connector so wagmi writeContract/sendTx calls hit Anvil.
 * - Without this, writeContract calls will fail during tests
 */
function withConnectedMockConnector<chain extends Chain>(
  testApi: WagmiChainTestAPI<chain>,
  chainId: number,
): WagmiChainTestAPI<chain> {
  return testApi.extend<{
    config: Config<readonly [chain], Record<chain['id'], HttpTransport>>
  }>({
    config: async ({ client, config }, use): Promise<void> => {
      await connectMockConnectorToAnvil({
        client: client as unknown as AnvilTestClient,
        wagmiConfig: config,
        chainId,
      })
      await use(config)
    },
  }) as WagmiChainTestAPI<chain>
}

beforeEach(async () => {
  vi.doMock('@/lib/config/wagmi.config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/config/wagmi.config')>()
    return {
      ...actual,
      getTransport: (chainId: number) => http(`http://localhost:${CHAIN_PORTS[chainId]}`),
    }
  })
})
