import { http, createPublicClient, createWalletClient, publicActions, createTestClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import type { Address } from 'viem'
import { ENV } from './env'

export const chain = base

export const publicClient = createPublicClient({
  chain,
  transport: http(ENV.RPC_URL, { batch: true }),
  batch: { multicall: true },
})

export const account = privateKeyToAccount(ENV.TEST_PRIVATE_KEY)
export const walletClient = createWalletClient({
  account,
  chain,
  transport: http(ENV.RPC_URL),
}).extend(publicActions)

export const testClient = ENV.RPC_KIND === 'anvil'
  ? createTestClient({ chain, mode: 'anvil', transport: http(ENV.RPC_URL) })
  : null

export async function setTenderlyNativeBalance(target: Address, hexBalance: `0x${string}`) {
  if (ENV.RPC_KIND !== 'tenderly') return
  try {
    // @ts-expect-error custom RPC method
    await publicClient.request({ method: 'tenderly_setBalance', params: [[target], hexBalance] })
  } catch {
    // ignore
  }
}

export async function setTenderlyErc20Balance(token: Address, target: Address, hexBalance: `0x${string}`) {
  if (ENV.RPC_KIND !== 'tenderly') return
  try {
    // @ts-expect-error custom RPC method
    await publicClient.request({
      method: 'tenderly_setErc20Balance',
      params: [token, target, hexBalance],
    })
  } catch {
    // ignore
  }
}

