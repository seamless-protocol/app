import { createTestClient, createWalletClient, http, parseEther, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

// Test address used by mock connector (Anvil default account #0)
export const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const

// Base canonical WETH address
export const BASE_WETH = '0x4200000000000000000000000000000000000006' as const

// Anvil RPC URL
const anvilUrl = 'http://127.0.0.1:8545'

// Create test client for Anvil test actions
export const testClient = createTestClient({
  chain: base,
  mode: 'anvil',
  transport: http(anvilUrl),
})

// Create wallet client for contract interactions (using Anvil default account private key)
const account = privateKeyToAccount(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
)
export const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(anvilUrl),
}).extend(publicActions)

/**
 * Fund the mock connector test account with ETH and WETH for E2E testing
 */
export async function fundMockAccount() {
  console.log('🔧 Funding mock connector account for E2E testing...')

  try {
    // 1. Set ETH balance for gas fees (10 ETH)
    await testClient.setBalance({
      address: TEST_ADDRESS,
      value: parseEther('10'),
    })
    console.log('✅ Set ETH balance: 10 ETH')

    // 2. Fund WETH balance by depositing ETH
    // We'll impersonate the test account and deposit ETH to get WETH
    await testClient.impersonateAccount({ address: TEST_ADDRESS })

    // Deposit 5 ETH to get 5 WETH using wallet client
    await walletClient.writeContract({
      address: BASE_WETH,
      abi: [
        {
          name: 'deposit',
          type: 'function',
          stateMutability: 'payable',
          inputs: [],
          outputs: [],
        },
      ],
      functionName: 'deposit',
      value: parseEther('5'),
    })
    console.log('✅ Deposited 5 ETH to get 5 WETH')

    await testClient.stopImpersonatingAccount({ address: TEST_ADDRESS })
    console.log('✅ Mock account funding complete')
  } catch (error) {
    console.error('❌ Failed to fund mock account:', error)
    throw error
  }
}

/**
 * Check balances of the mock account for debugging
 */
export async function checkMockAccountBalances() {
  try {
    // ETH balance
    const ethBalance = await testClient.getBalance({ address: TEST_ADDRESS })
    console.log(`ETH balance: ${ethBalance / 10n ** 18n} ETH`)

    // WETH balance
    const wethBalance = await walletClient.readContract({
      address: BASE_WETH,
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
    console.log(`WETH balance: ${wethBalance / 10n ** 18n} WETH`)

    return { ethBalance, wethBalance }
  } catch (error) {
    console.error('❌ Failed to check balances:', error)
    throw error
  }
}
