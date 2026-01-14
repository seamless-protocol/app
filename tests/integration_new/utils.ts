import { createPublicClient, http } from 'viem'
import { base, mainnet } from 'viem/chains'

export const mainnetPublicClient = createPublicClient({
  chain: mainnet,
  transport: http(import.meta.env['VITE_ETHEREUM_FORK_RPC_URL']),
})

export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(import.meta.env['VITE_BASE_FORK_RPC_URL']),
})
