import type { AnvilTestClient } from '@morpho-org/test'
import { createWagmiTest } from '@morpho-org/test-wagmi'
import { Request } from 'undici'
import type { Chain, HttpTransport } from 'viem'
import { base, mainnet } from 'viem/chains'
import type { TestAPI } from 'vitest'
import type { Config } from 'wagmi'
import { basePublicClient, mainnetPublicClient } from './utils'

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

export const mainnetTest: WagmiChainTestAPI<typeof mainnet> = createWagmiTest(mainnet, {
  forkBlockNumber: await mainnetPublicClient.getBlockNumber(),
  forkUrl: `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env['VITE_ALCHEMY_API_KEY']}`,
})

export const baseTest: WagmiChainTestAPI<typeof base> = createWagmiTest(base, {
  forkBlockNumber: await basePublicClient.getBlockNumber(),
  forkUrl: `https://base-mainnet.g.alchemy.com/v2/${import.meta.env['VITE_ALCHEMY_API_KEY']}`,
})

export const wagmiTest = (chainId: number): typeof mainnetTest =>
  (chainId === mainnet.id ? mainnetTest : baseTest) as typeof mainnetTest
