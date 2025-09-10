import { createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { ADDR, ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_ADDRESS } from '../shared/env'
import { topUpErc20, topUpNative } from '../shared/funding'

// Test address used by mock connector (Anvil default account #0)
export const TEST_ADDRESS = ANVIL_DEFAULT_ADDRESS

// Base weETH address
export const WEETH_ADDRESS = '0x04C0599Ae5A44757c0af6f9eC3b93da8976c150A' as const

// Anvil RPC URL
const anvilUrl = 'http://127.0.0.1:8545'

// Create wallet client for contract interactions (using Anvil default account private key)
const account = privateKeyToAccount(ANVIL_DEFAULT_PRIVATE_KEY)
export const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(anvilUrl),
}).extend(publicActions)

/**
 * Fund the mock connector test account with ETH and weETH for E2E testing
 */
export async function fundMockAccount() {
  console.log('🔧 Funding mock connector account with ETH + weETH for E2E testing...')
  try {
    await topUpNative(TEST_ADDRESS as any, '10')
    await topUpErc20(ADDR.weeth, TEST_ADDRESS as any, '5')
    console.log('✅ Mock account funding complete')
  } catch (error) {
    console.error('❌ Failed to fund mock account (weETH):', error)
    throw error
  }
}

/**
 * Check balances of the mock account for debugging
 */
export async function checkMockAccountBalances() {
  try {
    // ETH balance
    const ethBalance = await walletClient.getBalance({ address: TEST_ADDRESS })
    console.log(`ETH balance: ${ethBalance / 10n ** 18n} ETH`)

    // weETH balance
    const wethBalance = await walletClient.readContract({
      address: WEETH_ADDRESS,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [TEST_ADDRESS],
    })
    console.log(`weETH balance: ${wethBalance / 10n ** 18n} weETH`)

    return { ethBalance, wethBalance }
  } catch (error) {
    console.error('❌ Failed to check balances:', error)
    throw error
  }
}
