import { createViemTest } from '@morpho-org/test/playwright'
import { createWagmiTest } from '@morpho-org/test-wagmi'
import { Headers, Request, Response, fetch as undiciFetch } from 'undici'
import { mainnet } from 'viem/chains'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { mswServer } from './mocks/node'

// happy‑dom is providing its own fetch/Headers/Request/Response, and viem’s test client is using those to call the spawned anvil.
// happy‑dom’s fetch sometimes returns an empty body for the POST, so viem sees “Unexpected EOF”. Force Node/undici fetch instead.
// We use happy-dom because it provides the DOM APIs needed for `renderHook` from @morpho-org/test-wagmi to work. It also gives
// a more realistic browser environment for the tests.
globalThis.fetch = undiciFetch as unknown as typeof globalThis.fetch
globalThis.Headers = Headers as unknown as typeof globalThis.Headers
globalThis.Request = Request as unknown as typeof globalThis.Request
globalThis.Response = Response as unknown as typeof globalThis.Response

export const forkBlockNumber = 24219436n

export const wagmiTest = createWagmiTest(mainnet, {
  forkUrl: process.env['VITE_ETHEREUM_RPC_URL'],
  forkBlockNumber: forkBlockNumber,
})

export const playwrightTest = createViemTest(mainnet, {
  forkUrl: process.env['VITE_ETHEREUM_RPC_URL'],
  forkBlockNumber: forkBlockNumber,
})

beforeAll(() => mswServer.listen())
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
