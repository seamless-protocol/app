import {
  parseAbi,
  parseUnits,
  toHex,
  maxUint256,
  type Address,
} from 'viem'
import {
  ADDR,
  account,
  extraAccounts,
  extraWallets,
  publicClient,
  takeSnapshot,
  revertSnapshot,
  topUpNative,
  walletClient,
} from './setup'

// --------- Minimal ERC20 ABI slice ----------
export const erc20Abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
])

/** Tenderly Admin RPC: set ERC-20 balance (value must be 32-byte hex) */
export async function topUpErc20(
  token: Address,
  to: Address,
  amount: bigint,
) {
  await publicClient.request({
    method: 'tenderly_setErc20Balance' as any,
    params: [token, to, toHex(amount, { size: 32 })] as any,
  })
}

/** Reads decimals & parses human amount -> bigint (token units) */
export async function parseAmount(token: Address, human: string) {
  const decimals = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  return parseUnits(human, decimals)
}

/** Approves `spender` if current allowance < minAmount (approves max) */
export async function approveIfNeeded(
  token: Address,
  spender: Address,
  minAmount: bigint,
) {
  const allowance = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, spender],
  })
  if (allowance >= minAmount) return
  const hash = await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, maxUint256],
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

// --------- withFork wrapper ----------
export type WithForkCtx = {
  account: typeof account
  walletClient: typeof walletClient
  publicClient: typeof publicClient
  ADDR: typeof ADDR
  // optional multi-account participants
  others: { account: (typeof extraAccounts)[number]; wallet: (typeof extraWallets)[number] }[]
  fund: {
    native: (addrs: Address[], ether: string) => Promise<void>
    erc20: (token: Address, targets: Address[], human: string) => Promise<void>
  }
}

export async function withFork<T>(
  fn: (ctx: WithForkCtx) => Promise<T>,
): Promise<T> {
  const snap = await takeSnapshot()
  try {
    const ctx: WithForkCtx = {
      account,
      walletClient,
      publicClient,
      ADDR,
      others: extraAccounts.map((acct, i) => ({
        account: acct,
        wallet: extraWallets[i]!,
      })),
      fund: {
        native: async (addrs, ether) => {
          await Promise.all(addrs.map((a) => topUpNative(a, ether)))
        },
        erc20: async (token, targets, human) => {
          const amt = await parseAmount(token, human)
          await Promise.all(targets.map((t) => topUpErc20(token, t, amt)))
        },
      },
    }
    return await fn(ctx)
  } finally {
    await revertSnapshot(snap)
  }
}