import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: resolve(__dirname, '../integration/.env') })

export type RpcKind = 'anvil' | 'tenderly'

const RAW_RPC_URL =
  process.env['TEST_RPC_URL'] ?? process.env['ANVIL_RPC_URL'] ?? 'http://127.0.0.1:8545'
let RAW_RPC_KIND = (process.env['TEST_RPC_KIND'] ?? '') as RpcKind | ''
if (!RAW_RPC_KIND) {
  RAW_RPC_KIND = (RAW_RPC_URL.includes('tenderly') ? 'tenderly' : 'anvil') as RpcKind
}

export const ENV = {
  RPC_KIND: RAW_RPC_KIND as RpcKind,
  RPC_URL: RAW_RPC_URL,
  CHAIN_ID: Number(process.env['TEST_CHAIN_ID'] ?? 8453),
  TEST_PRIVATE_KEY: (process.env['TEST_PRIVATE_KEY'] ??
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`,
  ADDR: {
    // Fallback to known Base mainnet addresses if not provided in env
    MANAGER: (process.env['TEST_LEVERAGE_MANAGER'] ??
      '0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8') as `0x${string}`,
    ROUTER: (process.env['TEST_LEVERAGE_ROUTER'] ??
      '0xDbA92fC3dc10a17b96b6E807a908155C389A887C') as `0x${string}`,
    TOKEN: (process.env['TEST_LEVERAGE_TOKEN_PROXY'] ??
      '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c') as `0x${string}`,
    WEETH: (process.env['TEST_WEETH'] ??
      '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A') as `0x${string}`,
  },
  WEETH_WHALE: (process.env['TEST_WEETH_WHALE'] ??
    '0x566d2176Ecb1d8eA07D182b47B5aC57511337E00') as `0x${string}`,
}
