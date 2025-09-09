import type { PublicClient, WalletClient } from 'viem'

/**
 * Slice 1 placeholder for constructing clients for tests.
 * In later slices we will wire to Anvil/Tenderly. For now we only define the shape
 * to keep TypeScript and unit tests happy without network access.
 */
export interface TestClients {
  publicClient: PublicClient
  walletClient: WalletClient
}

export function makeTestClients(_rpcUrl?: string): TestClients {
  throw new Error('makeTestClients is not available in slice 1 (no network).')
}
