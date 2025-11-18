import { type Address, erc20Abi, getAddress, maxUint256, parseAbi, parseUnits, toHex } from 'viem'
import { BASE_WETH } from '../../src/lib/contracts/addresses.js'
import {
  ADDR,
  account,
  adminRequest,
  mode,
  publicClient,
  testClient,
  walletClient,
} from './clients'

// Re-export commonly used ABIs
export { erc20Abi }

// WETH ABI slice
export const wethAbi = parseAbi(['function deposit() payable', 'function withdraw(uint256 wad)'])

/** Top up native balance */
export async function topUpNative(to: Address, ether: string) {
  if (mode === 'anvil') {
    await testClient.setBalance({ address: to, value: parseUnits(ether, 18) })
    return
  }
  // Use tenderly_addBalance so the action surfaces as a transaction in the VNet explorer
  // (setBalance performs a direct state write and may not show as a tx)
  await adminRequest('tenderly_addBalance', [[to], toHex(parseUnits(ether, 18))])
}

/** Set ERC-20 balance via admin RPC (Tenderly) */
export async function setErc20Balance(token: Address, to: Address, human: string) {
  const decimals = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  const raw = parseUnits(human, decimals)
  await adminRequest('tenderly_setErc20Balance', [token, to, toHex(raw)])
}

async function fundErc20ViaWethDeposit(token: Address, to: Address, human: string) {
  if (getAddress(token) !== getAddress(BASE_WETH)) return false
  const value = parseUnits(human, 18)
  await walletClient.writeContract({
    address: BASE_WETH,
    abi: wethAbi,
    functionName: 'deposit',
    value,
    account,
  })
  if (getAddress(account.address) !== getAddress(to)) {
    await walletClient.writeContract({
      address: BASE_WETH,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, value],
      account,
    })
  }
  return true
}

// Token addresses follow the detected chain configuration
const USDC_ADDRESS = getAddress(ADDR.usdc)
const weETH_ADDRESS = getAddress(ADDR.weeth)
// wstETH on Mainnet
const WSTETH_MAINNET = getAddress('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0')

// Rich holders for token funding via impersonation (Anvil only)
const RICH_HOLDERS: Record<Address, Address | undefined> = {
  [USDC_ADDRESS]: '0x3304dd20f87a67ed649c3dF34aD6b19dFEC33877' as Address, // Coinbase custody wallet
  [weETH_ADDRESS]: '0xb26ff591F44b04E78de18f43B46f8b70C6676984' as Address, // Large weETH holder
  [WSTETH_MAINNET]: '0x0B925eD163218f6662a35e0f0371Ac234f9E9371' as Address, // Aave v3 wstETH pool
}

async function fundErc20ViaImpersonation(
  token: Address,
  to: Address,
  human: string,
  richHolder?: Address,
) {
  if (mode === 'tenderly') return false
  const holder = richHolder ?? RICH_HOLDERS[getAddress(token)]
  if (!holder) return false
  await testClient.setBalance({ address: holder, value: parseUnits('1', 18) })
  await testClient.impersonateAccount({ address: holder })
  const decimals = (await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'decimals',
  })) as number
  const amount = parseUnits(human, decimals)
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

export async function topUpErc20(token: Address, to: Address, human: string, richHolder?: Address) {
  if (await fundErc20ViaWethDeposit(token, to, human)) return
  if (mode === 'tenderly') return await setErc20Balance(token, to, human)
  if (await fundErc20ViaImpersonation(token, to, human, richHolder)) return
  throw new Error('ERC-20 funding failed: no viable strategy for this token')
}

async function setErc20BalanceRaw(token: Address, to: Address, amount: bigint) {
  await adminRequest('tenderly_setErc20Balance', [token, to, toHex(amount)])
}

const ZERO_ADDRESS = getAddress('0x0000000000000000000000000000000000000000')

const UNISWAP_V2_ROUTER_INFO_ABI = parseAbi(['function factory() view returns (address)'])
const UNISWAP_V2_FACTORY_ABI = parseAbi([
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
])
const UNISWAP_V2_PAIR_ABI = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function sync()',
])

const MAX_UINT112 = (1n << 112n) - 1n

function ceilDiv(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error('Division by zero in ceilDiv')
  if (a === 0n) return 0n
  return (a + (b - 1n)) / b
}

function boundScale(scale: bigint, bases: Array<bigint>): bigint {
  let maxScale = MAX_UINT112
  for (const base of bases) {
    if (base <= 0n) continue
    const candidate = MAX_UINT112 / base
    if (candidate < maxScale) maxScale = candidate
  }
  if (maxScale < 1n) {
    // If existing balances exceed uint112 (should not happen), fall back to 1
    maxScale = 1n
  }
  if (scale > maxScale) return maxScale
  if (scale < 1n) return 1n
  return scale
}

export async function seedUniswapV2PairLiquidity(options: {
  router: Address
  tokenA: Address
  tokenB: Address
  multiplier?: bigint
  minimumTokenA?: string
  minimumTokenB?: string
}): Promise<void> {
  if (mode !== 'tenderly') {
    console.warn('[POOL SEED] Skipping Uniswap v2 seeding outside Tenderly mode')
    return
  }

  // Ensure the signer has native funds to pay gas for pair.sync and approvals
  try {
    await topUpNative(account.address, '1')
  } catch (e) {
    console.warn('[POOL SEED] Failed to pre-fund signer for gas', e)
  }

  const { router, multiplier = 2000n } = options
  const safeMultiplier = multiplier < 1n ? 1n : multiplier

  const canonicalTokenA = getAddress(options.tokenA)
  const canonicalTokenB = getAddress(options.tokenB)
  const minimumOverrides = new Map<string, string>([
    [canonicalTokenA.toLowerCase(), options.minimumTokenA ?? '10'],
    [canonicalTokenB.toLowerCase(), options.minimumTokenB ?? '10'],
  ])

  const factory = (await publicClient.readContract({
    address: router,
    abi: UNISWAP_V2_ROUTER_INFO_ABI,
    functionName: 'factory',
  })) as Address
  if (factory === ZERO_ADDRESS) {
    throw new Error('Uniswap v2 router returned zero factory address')
  }

  const pairLookupTokens = [canonicalTokenA, canonicalTokenB].sort((a, b) =>
    a.toLowerCase() > b.toLowerCase() ? 1 : -1,
  ) as [Address, Address]

  const pairAddress = (await publicClient.readContract({
    address: factory,
    abi: UNISWAP_V2_FACTORY_ABI,
    functionName: 'getPair',
    args: pairLookupTokens,
  })) as Address

  if (pairAddress === ZERO_ADDRESS) {
    throw new Error('Uniswap v2 pair not deployed for provided tokens')
  }

  const [pairToken0, pairToken1] = (await Promise.all([
    publicClient.readContract({
      address: pairAddress,
      abi: UNISWAP_V2_PAIR_ABI,
      functionName: 'token0',
    }) as Promise<Address>,
    publicClient.readContract({
      address: pairAddress,
      abi: UNISWAP_V2_PAIR_ABI,
      functionName: 'token1',
    }) as Promise<Address>,
  ])) as [Address, Address]

  const pairTokenSet = new Set([pairToken0.toLowerCase(), pairToken1.toLowerCase()])
  if (
    !pairTokenSet.has(canonicalTokenA.toLowerCase()) ||
    !pairTokenSet.has(canonicalTokenB.toLowerCase())
  ) {
    throw new Error('Uniswap v2 pair tokens mismatch requested tokens')
  }

  const [reserve0, reserve1] = (await publicClient.readContract({
    address: pairAddress,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: 'getReserves',
  })) as readonly [bigint, bigint, number]

  const decimals0 = (await publicClient.readContract({
    address: pairToken0,
    abi: erc20Abi,
    functionName: 'decimals',
  })) as number
  const decimals1 = (await publicClient.readContract({
    address: pairToken1,
    abi: erc20Abi,
    functionName: 'decimals',
  })) as number

  const minimumForToken0 = minimumOverrides.get(pairToken0.toLowerCase()) ?? '10'
  const minimumForToken1 = minimumOverrides.get(pairToken1.toLowerCase()) ?? '10'

  const minBase0 = parseUnits(minimumForToken0, decimals0)
  const minBase1 = parseUnits(minimumForToken1, decimals1)

  const baseReserve0 = reserve0 > 0n ? reserve0 : minBase0
  const baseReserve1 = reserve1 > 0n ? reserve1 : minBase1

  const desiredMin0 = minBase0 * safeMultiplier
  const desiredMin1 = minBase1 * safeMultiplier

  const scaleCandidates = [1n, safeMultiplier]
  if (baseReserve0 > 0n) scaleCandidates.push(ceilDiv(desiredMin0, baseReserve0))
  if (baseReserve1 > 0n) scaleCandidates.push(ceilDiv(desiredMin1, baseReserve1))

  let desiredScale = scaleCandidates.reduce((acc, value) => (value > acc ? value : acc), 1n)
  desiredScale = boundScale(desiredScale, [baseReserve0, baseReserve1])

  const targetReserve0 = baseReserve0 * desiredScale
  const targetReserve1 = baseReserve1 * desiredScale

  await setErc20BalanceRaw(pairToken0, pairAddress, targetReserve0)
  await setErc20BalanceRaw(pairToken1, pairAddress, targetReserve1)

  const hash = await walletClient.writeContract({
    address: pairAddress,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: 'sync',
    account,
  })
  await publicClient.waitForTransactionReceipt({ hash })

  const [syncedReserve0, syncedReserve1] = (await publicClient.readContract({
    address: pairAddress,
    abi: UNISWAP_V2_PAIR_ABI,
    functionName: 'getReserves',
  })) as readonly [bigint, bigint, number]

  console.info('[POOL SEED] Seeded Uniswap v2 liquidity', {
    router,
    pairAddress,
    tokens: {
      token0: pairToken0,
      token1: pairToken1,
    },
    multiplier: safeMultiplier.toString(),
    appliedScale: desiredScale.toString(),
    targets: {
      token0: targetReserve0.toString(),
      token1: targetReserve1.toString(),
    },
    reserves: {
      before: {
        token0: reserve0.toString(),
        token1: reserve1.toString(),
      },
      after: {
        token0: syncedReserve0.toString(),
        token1: syncedReserve1.toString(),
      },
    },
  })
}

export async function parseAmount(token: Address, human: string) {
  const decimals = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  return parseUnits(human, Number(decimals))
}

export async function approveIfNeeded(token: Address, spender: Address, minAmount: bigint) {
  const allowance = await publicClient.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, spender],
  })
  if ((allowance as bigint) >= minAmount) return
  const hash = await walletClient.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, maxUint256],
  })
  await publicClient.waitForTransactionReceipt({ hash })
}
