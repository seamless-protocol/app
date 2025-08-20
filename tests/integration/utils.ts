import {
  parseAbi,
  parseUnits,
  parseEther,
  maxUint256,
  getAddress,
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
  testClient,
} from './setup'

// --------- Minimal ERC20 ABI slice ----------
export const erc20Abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
])

// --------- WETH ABI slice ----------
export const wethAbi = parseAbi([
  'function deposit() payable',
  'function withdraw(uint256 wad)',
])

// Base canonical WETH on L2s often uses the 0x4200...0006 pattern on OP-stack chains.
// On Base, WETH = 0x4200...0006
const BASE_WETH: Address = '0x4200000000000000000000000000000000000006'

/** Optional: known rich holders (fill as needed for your tokens)
 *  Safer than poking storage on modern (ERC‑7201 namespaced) tokens. */
const RICH_HOLDERS: Record<string, Address | undefined> = {
  // USDC on Base (native) - Coinbase treasury address
  [getAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')]: getAddress('0x3304dd20f87a67ed649c3dF34aD6b19dFEC33877'),
  // weETH on Base (from test output) - use a major holder
  [getAddress('0x04c0599ae5a44757c0af6f9ec3b93da8976c150a')]: getAddress('0xb26ff591F44b04E78de18f43B46f8b70C6676984'), // Binance 14
}

async function fundErc20ViaWethDeposit(token: Address, to: Address, human: string): Promise<boolean> {
  if (token.toLowerCase() !== BASE_WETH.toLowerCase()) return false
  const value = parseUnits(human, 18)
  
  // Deposit ETH to get WETH
  await walletClient.writeContract({
    address: BASE_WETH,
    abi: wethAbi,
    functionName: 'deposit',
    value,
    account: account.address,
  })
  
  // Transfer WETH to target if depositor != target
  if (account.address.toLowerCase() !== to.toLowerCase()) {
    await walletClient.writeContract({
      address: BASE_WETH,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, value],
      account: account.address,
    })
  }
  return true
}

/** Impersonate a rich holder and transfer tokens */
async function fundErc20ViaImpersonation(token: Address, to: Address, human: string): Promise<boolean> {
  const holder = RICH_HOLDERS[getAddress(token)]
  if (!holder) return false

  // Give the holder gas and impersonate
  await testClient.setBalance({ address: holder, value: 10n ** 18n }) // 1 ETH
  await testClient.impersonateAccount({ address: holder })

  const decimals = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  const amount = parseUnits(human, Number(decimals))

  // JSON-RPC account (impersonated) — send via eth_sendTransaction
  await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, amount],
    account: holder,
  })

  await testClient.stopImpersonatingAccount({ address: holder })
  return true
}

/** (Advanced/Opt-in) Storage write approach — DISABLED by default
 *  Modern ERC‑20s (OZ v5 with ERC‑7201 namespaced storage) may not use slot 0.
 *  Only enable if you know the correct slot & accept the risk. */
async function fundErc20ViaStorageWrite(): Promise<never> {
  throw new Error(
    'Storage-write funding is disabled. Prefer WETH deposit or impersonation. ' +
      'If you must set balances via storage, implement testClient.setStorageAt with the correct mapping slot.',
  )
}

/** Top up ERC-20 balance using safe funding strategies */
export async function topUpErc20(
  token: Address,
  to: Address,
  human: string,
) {
  if (await fundErc20ViaWethDeposit(token, to, human)) return
  if (await fundErc20ViaImpersonation(token, to, human)) return
  await fundErc20ViaStorageWrite()
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
          for (const target of targets) {
            await topUpErc20(token, target, human)
          }
        },
      },
    }
    return await fn(ctx)
  } finally {
    await revertSnapshot(snap)
  }
}