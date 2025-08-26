import { resolve } from 'node:path'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../integration/.env') })

export type RpcKind = 'anvil' | 'tenderly'

export const ENV = {
  RPC_KIND: (process.env['TEST_RPC_KIND'] ?? 'anvil') as RpcKind,
  RPC_URL: process.env['TEST_RPC_URL'] ?? process.env['ANVIL_RPC_URL'] ?? 'http://127.0.0.1:8545',
  CHAIN_ID: Number(process.env['TEST_CHAIN_ID'] ?? 8453),
  TEST_PRIVATE_KEY: (process.env['TEST_PRIVATE_KEY'] ??
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`,
  ADDR: {
    MANAGER: process.env['TEST_LEVERAGE_MANAGER'] as `0x${string}`,
    ROUTER: process.env['TEST_LEVERAGE_ROUTER'] as `0x${string}`,
    TOKEN: process.env['TEST_LEVERAGE_TOKEN_PROXY'] as `0x${string}`,
    WEETH: (process.env['TEST_WEETH'] ??
      '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A') as `0x${string}`,
  },
  WEETH_WHALE: (process.env['TEST_WEETH_WHALE'] ??
    '0x566d2176Ecb1d8eA07D182b47B5aC57511337E00') as `0x${string}`,
}
