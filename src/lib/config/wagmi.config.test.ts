import type { Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createConfig, http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { mock } from 'wagmi/connectors'

// Use a deterministic account for tests (Anvil default #0 unless overridden)
export const TEST_ADDRESS = (import.meta.env['VITE_TEST_ADDRESS'] ??
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266') as Address

export const anvilUrl = import.meta.env['VITE_ANVIL_RPC_URL'] ?? 'http://127.0.0.1:8545'

const testRpcUrl =
  import.meta.env['VITE_TEST_RPC_URL'] ??
  import.meta.env['VITE_TENDERLY_RPC_URL'] ??
  import.meta.env['VITE_BASE_RPC_URL'] ??
  anvilUrl

// ⚠️ test-only: Local Account signer for writes during E2E
const TEST_PRIVATE_KEY = import.meta.env['VITE_TEST_PRIVATE_KEY'] as Address | undefined
export const testLocalAccount = TEST_PRIVATE_KEY ? privateKeyToAccount(TEST_PRIVATE_KEY) : undefined

export const testConfig = createConfig({
  chains: [base, mainnet],
  connectors: [
    mock({
      accounts: [TEST_ADDRESS], // UI shows this address
      features: { reconnect: true },
    }),
  ],
  transports: { [base.id]: http(testRpcUrl), [mainnet.id]: http(testRpcUrl) },
  ssr: false,
})
