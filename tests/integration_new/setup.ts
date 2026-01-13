import { createWagmiTest } from '@morpho-org/test-wagmi'
import { basePublicClient, mainnetPublicClient } from './utils'
import { Request } from 'undici'
import { base, mainnet } from 'viem/chains'


// Vitest is overriding the AbortController and AbortSignal globals from jsdom and Node 24's native fetch (undici) does not 
// work with jsdom's AbortSignal implementation.
// Without this assignment, some blockchain test actions (such as RPC calls to Anvil)
// will throw an error like:
//   "Failed to construct 'Request': signal is not of type AbortSignal."
// This occurs because Viem expects the global Request implementation to match browser standards.
// By assigning undici's Request to globalThis.Request, we ensure Node.js tests use the correct implementation.
// Note: This has been fixed in vitest but not yet released in a stable version.
globalThis.Request = Request as unknown as typeof globalThis.Request

export const mainnetTest = createWagmiTest(mainnet, {
  forkBlockNumber: await mainnetPublicClient.getBlockNumber(),
  forkUrl: import.meta.env['VITE_ETHEREUM_RPC_URL'],
})

export const baseTest = createWagmiTest(base, {
  forkBlockNumber: await basePublicClient.getBlockNumber(),
  forkUrl: import.meta.env['VITE_BASE_RPC_URL'],
})