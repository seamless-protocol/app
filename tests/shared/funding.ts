import { type Address, erc20Abi, getAddress, maxUint256, parseAbi, parseUnits, toHex } from 'viem'
import { account, adminRequest, mode, publicClient, testClient, walletClient } from './clients'

// Re-export commonly used ABIs
export { erc20Abi }

// WETH ABI slice
export const wethAbi = parseAbi(['function deposit() payable', 'function withdraw(uint256 wad)'])

const BASE_WETH: Address = '0x4200000000000000000000000000000000000006'

/** Top up native balance */
export async function topUpNative(to: Address, ether: string) {
  if (mode === 'anvil') {
    await testClient.setBalance({ address: to, value: parseUnits(ether, 18) })
    return
  }
  // Tenderly expects array of addresses as first parameter
  await adminRequest('tenderly_setBalance', [[to], toHex(parseUnits(ether, 18))])
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

// Token addresses from Base network
const USDC_ADDRESS: Address = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
const weETH_ADDRESS: Address = '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a'

// Rich holders for token funding via impersonation (Anvil only)
const RICH_HOLDERS: Record<Address, Address | undefined> = {
  [USDC_ADDRESS]: '0x3304dd20f87a67ed649c3dF34aD6b19dFEC33877' as Address, // Coinbase custody wallet
  [weETH_ADDRESS]: '0xb26ff591F44b04E78de18f43B46f8b70C6676984' as Address, // Large weETH holder
}

async function fundErc20ViaImpersonation(token: Address, to: Address, human: string) {
  if (mode === 'tenderly') return false
  const holder = RICH_HOLDERS[getAddress(token)]
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

export async function topUpErc20(token: Address, to: Address, human: string) {
  if (await fundErc20ViaWethDeposit(token, to, human)) return
  if (mode === 'tenderly') return await setErc20Balance(token, to, human)
  if (await fundErc20ViaImpersonation(token, to, human)) return
  throw new Error('ERC-20 funding failed: no viable strategy for this token')
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
