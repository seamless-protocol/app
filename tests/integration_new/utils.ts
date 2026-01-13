import { createPublicClient, http } from 'viem'
import { base, mainnet } from 'viem/chains'

export const mainnetPublicClient = createPublicClient({
  chain: mainnet,
  transport: http(
    `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env['VITE_ALCHEMY_API_KEY']}`,
  ),
})

export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(
    `https://base-mainnet.g.alchemy.com/v2/${import.meta.env['VITE_ALCHEMY_API_KEY']}`,
  ),
})
