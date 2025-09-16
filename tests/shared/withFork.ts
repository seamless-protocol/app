import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import {
  ADDR,
  account,
  extraAccounts,
  extraWallets,
  publicClient,
  revertSnapshot,
  takeSnapshot,
  walletClient,
} from './clients'
import { topUpErc20, topUpNative } from './funding'
import { wagmiConfig } from './wagmi'

export type WithForkCtx = {
  account: typeof account
  walletClient: typeof walletClient
  publicClient: typeof publicClient
  config: Config
  ADDR: typeof ADDR
  others: Array<{ account: (typeof extraAccounts)[number]; wallet: (typeof extraWallets)[number] }>
  fund: {
    native: (addrs: Array<Address>, ether: string) => Promise<void>
    erc20: (token: Address, targets: Array<Address>, human: string) => Promise<void>
  }
}

export async function withFork<T>(fn: (ctx: WithForkCtx) => Promise<T>): Promise<T> {
  console.info('[STEP] Take snapshot')
  const snap: Hash = await takeSnapshot()
  console.info('[STEP] Snapshot taken', { snap })
  try {
    const ctx: WithForkCtx = {
      account,
      walletClient,
      publicClient,
      config: wagmiConfig as Config,
      ADDR,
      others: extraAccounts
        .map((acct, i) => {
          const wallet = extraWallets[i]
          if (!wallet) return undefined
          return { account: acct, wallet }
        })
        .filter(Boolean) as Array<{
        account: (typeof extraAccounts)[number]
        wallet: (typeof extraWallets)[number]
      }>,
      fund: {
        native: async (addrs, ether) => {
          await Promise.all(addrs.map((a) => topUpNative(a, ether)))
        },
        erc20: async (token, targets, human) => {
          for (const target of targets) await topUpErc20(token, target, human)
        },
      },
    }
    return await fn(ctx)
  } finally {
    console.info('[STEP] Reverting snapshot', { snap })
    await revertSnapshot(snap)
    console.info('[STEP] Snapshot reverted')
  }
}
