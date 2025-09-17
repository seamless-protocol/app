import { connect } from '@wagmi/core'
import type { Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { createConfig, http } from 'wagmi'
import { mock } from 'wagmi/connectors'
import { CHAIN, Env, RPC } from './env'

const testAccount = privateKeyToAccount(Env.TEST_PRIVATE_KEY as Hex)
const mockConnector = mock({ accounts: [testAccount.address] })

// Single source of truth for Wagmi config in integration tests.
// Uses the TEST_RPC_URL (Tenderly VNet) when provided; otherwise falls back to Anvil.
export const wagmiConfig = createConfig({
  chains: [CHAIN],
  transports: { [CHAIN.id]: http(RPC.primary) },
  connectors: [mockConnector],
  ssr: false,
})

await connect(wagmiConfig, { connector: mockConnector, chainId: CHAIN.id })
