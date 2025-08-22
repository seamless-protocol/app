import { createTestClient, createPublicClient, createWalletClient, http, parseEther, keccak256, encodeAbiParameters } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

// Test account details
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const TEST_ACCOUNT = privateKeyToAccount(TEST_PRIVATE_KEY)
const ANVIL_RPC_URL = 'http://127.0.0.1:8545'

// Token addresses on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'
const WEETH_ADDRESS = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' // weETH (Wrapped eETH)

// Known WETH whale on Base for impersonation
const WETH_WHALE = '0xecbf6e57d9430b8F79927e6109183846fab55D25' // Base WETH whale

const WETH_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    inputs: [{ name: 'guy', type: 'address' }, { name: 'wad', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
] as const

// Known weETH whale on Base
const WEETH_WHALE = '0x46a83dC1a264Bff133dB887023d2884167094837'

async function fundTestAccount() {
  console.log('🔧 Setting up test account with weETH...')

  // Create clients
  const testClient = createTestClient({
    chain: base,
    mode: 'anvil',
    transport: http(ANVIL_RPC_URL),
  })

  const publicClient = createPublicClient({
    chain: base,
    transport: http(ANVIL_RPC_URL),
  })

  const walletClient = createWalletClient({
    chain: base,
    transport: http(ANVIL_RPC_URL),
    account: TEST_ACCOUNT,
  })

  try {
    // Step 1: Verify chain ID
    const chainId = await publicClient.getChainId()
    console.log(`Chain ID: ${chainId} (expected: 8453)`)
    if (chainId !== 8453) {
      throw new Error(`Wrong chain ID: ${chainId}, expected 8453 (Base)`)
    }

    // Step 2: Fund test account with ETH (for gas)
    console.log('1. Funding test account with ETH...')
    await testClient.setBalance({
      address: TEST_ACCOUNT.address,
      value: parseEther('100'),
    })

    // Step 3: Directly set test account weETH balance using Anvil's deal cheat
    console.log('2. Setting test account weETH balance directly...')
    const weETHAmount = parseEther('10') // 10 weETH - plenty for testing
    
    // Use Anvil's deal functionality to directly set ERC20 balance
    // This is much simpler than storage slot manipulation
    try {
      await testClient.request({
        method: 'anvil_deal',
        params: [WEETH_ADDRESS, TEST_ACCOUNT.address, `0x${weETHAmount.toString(16)}`]
      })
      console.log(`Set test account weETH balance to ${weETHAmount.toString()} wei via anvil_deal`)
    } catch (dealError) {
      console.log('anvil_deal failed, trying storage manipulation...')
      
      // Fallback: Try different storage slot layouts for ERC20 balances
      const attempts = [
        // Try slot 0 (most common)
        keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [TEST_ACCOUNT.address, BigInt(0)])),
        // Try slot 1 
        keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [TEST_ACCOUNT.address, BigInt(1)])),
        // Try reversed order (account first, then slot)
        keccak256(encodeAbiParameters([{ type: 'uint256' }, { type: 'address' }], [BigInt(0), TEST_ACCOUNT.address]))
      ]
      
      for (let i = 0; i < attempts.length; i++) {
        try {
          await testClient.setStorageAt({
            address: WEETH_ADDRESS,
            index: attempts[i],
            value: `0x${weETHAmount.toString(16).padStart(64, '0')}`
          })
          
          // Check if this worked
          const testBalance = await publicClient.readContract({
            address: WEETH_ADDRESS,
            abi: WETH_ABI,
            functionName: 'balanceOf',
            args: [TEST_ACCOUNT.address],
          })
          
          if (testBalance >= parseEther('1')) {
            console.log(`Storage manipulation succeeded with slot attempt ${i + 1}`)
            break
          }
        } catch (e) {
          console.log(`Storage slot attempt ${i + 1} failed`)
        }
      }
    }

    // Step 4: Verify weETH balance
    const weETHBalance = await publicClient.readContract({
      address: WEETH_ADDRESS,
      abi: WETH_ABI,
      functionName: 'balanceOf',
      args: [TEST_ACCOUNT.address],
    })
    
    console.log(`✅ Test account weETH balance: ${weETHBalance.toString()} (${weETHBalance / BigInt(10**18)} weETH)`)

    if (weETHBalance >= BigInt(100000000000)) { // ~0.0001 weETH in wei, accept any reasonable amount
      console.log('✅ Test account successfully funded with weETH!')
      return true
    } else {
      throw new Error('Failed to fund test account with sufficient weETH')
    }
  } catch (error) {
    console.error('❌ Failed to fund test account:', error)
    return false
  }
}

export { fundTestAccount }

// Run if called directly
if (import.meta.main) {
  fundTestAccount()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}