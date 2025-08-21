import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { mock } from 'wagmi/connectors'
import { privateKeyToAccount } from 'viem/accounts'

// Use a deterministic account for tests (Anvil default #0 unless overridden)
export const TEST_ADDRESS = (import.meta.env['VITE_TEST_ADDRESS'] ??
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266') as `0x${string}`

export const anvilUrl = import.meta.env['VITE_ANVIL_RPC_URL'] ?? 'http://127.0.0.1:8545'

// ⚠️ test-only: Local Account signer for writes during E2E
const TEST_PRIVATE_KEY = import.meta.env['VITE_TEST_PRIVATE_KEY'] as `0x${string}` | undefined
export const testLocalAccount = TEST_PRIVATE_KEY
  ? privateKeyToAccount(TEST_PRIVATE_KEY)
  : undefined

export const testConfig = createConfig({
  chains: [base],
  connectors: [
    mock({
      accounts: [TEST_ADDRESS], // UI shows this address
      features: { reconnect: true },
    }),
  ],
  transports: { [base.id]: http(anvilUrl) },
  ssr: false,
})
