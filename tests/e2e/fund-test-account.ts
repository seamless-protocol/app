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

    // Step 3: Directly set weETH balance using storage manipulation
    console.log('2. Setting weETH balance directly using storage manipulation...')
    const weETHAmount = parseEther('10') // 10 weETH
    
    // For standard ERC20 tokens, balances are usually in slot 0
    // Storage slot = keccak256(abi.encodePacked(account, slot))
    // We'll try the standard mapping pattern first
    
    try {
      // Try slot 0 (most common for balances mapping)
      const slot = 0
      
      // Calculate storage slot: keccak256(abi.encode(account, slot))
      const storageKey = keccak256(
        encodeAbiParameters(
          [{ type: 'address' }, { type: 'uint256' }],
          [TEST_ACCOUNT.address, BigInt(slot)]
        )
      )
      
      await testClient.setStorageAt({
        address: WEETH_ADDRESS,
        index: storageKey,
        value: `0x${weETHAmount.toString(16).padStart(64, '0')}`
      })
      
      console.log(`Set weETH balance via storage slot: ${storageKey}`)
      
      // Check if it worked
      const testBalance = await publicClient.readContract({
        address: WEETH_ADDRESS,
        abi: WETH_ABI,
        functionName: 'balanceOf',
        args: [TEST_ACCOUNT.address],
      })
      
      if (testBalance < parseEther('1')) {
        throw new Error('Storage manipulation failed, balance still 0')
      }
    } catch (error) {
      console.log('Storage manipulation failed, trying impersonation approach...')
      
      // Fallback: try to get more weETH through impersonation and artificial funding
      await testClient.setBalance({
        address: WEETH_WHALE,
        value: parseEther('100'), // Give whale ETH for gas
      })
      
      // Give the whale a much larger weETH balance artificially
      const whaleSlot = keccak256(
        encodeAbiParameters(
          [{ type: 'address' }, { type: 'uint256' }],
          [WEETH_WHALE, BigInt(0)]
        )
      )
      
      await testClient.setStorageAt({
        address: WEETH_ADDRESS,
        index: whaleSlot,
        value: `0x${parseEther('1000').toString(16).padStart(64, '0')}`
      })
      
      // Check whale balance after manipulation
      const whaleBalance = await publicClient.readContract({
        address: WEETH_ADDRESS,
        abi: WETH_ABI,
        functionName: 'balanceOf',
        args: [WEETH_WHALE],
      })
      console.log(`Whale balance after manipulation: ${whaleBalance.toString()} weETH`)
      
      // Impersonate whale and transfer
      await testClient.impersonateAccount({ address: WEETH_WHALE })
      
      const whaleClient = createWalletClient({
        chain: base,
        transport: http(ANVIL_RPC_URL),
        account: WEETH_WHALE,
      })
      
      // Transfer available weETH from whale to test account
      const transferAmount = whaleBalance > weETHAmount ? weETHAmount : whaleBalance
      console.log(`Transferring ${transferAmount.toString()} weETH from whale to test account`)
      
      try {
        const transferHash = await whaleClient.writeContract({
          address: WEETH_ADDRESS,
          abi: WETH_ABI, // Same transfer function
          functionName: 'transfer',
          args: [TEST_ACCOUNT.address, transferAmount],
        })
        
        console.log(`Transfer hash: ${transferHash}`)
        
        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash: transferHash })
        console.log('Transfer confirmed')
        
      } catch (transferError) {
        console.error('Transfer failed:', transferError)
      }
      
      await testClient.stopImpersonatingAccount({ address: WEETH_WHALE })
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