import { createPublicClient, createTestClient, createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

// Test account details
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const TEST_ACCOUNT = privateKeyToAccount(TEST_PRIVATE_KEY)
const ANVIL_RPC_URL = 'http://127.0.0.1:8545'

// Token addresses on Base
// const _WETH_ADDRESS = '0x4200000000000000000000000000000000000006'
const WEETH_ADDRESS = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' // weETH (Wrapped eETH)

// Whale addresses (for impersonation)
// const _WETH_WHALE = '0xecbf6e57d9430b8F79927e6109183846fab55D25' // Base WETH whale
const WEETH_WHALE = '0xbD3cd0D9d429b41F0a2e1C026552Bd598294d5E0' // Base weETH whale

const WETH_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    inputs: [
      { name: 'guy', type: 'address' },
      { name: 'wad', type: 'uint256' },
    ],
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

  createWalletClient({
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

    // Step 2: Fund test account with ETH (for gas) if needed
    console.log('1. Funding test account with ETH...')
    await testClient.setBalance({
      address: TEST_ACCOUNT.address,
      value: parseEther('100'),
    })

    // Step 3: Fund test account with weETH using whale impersonation (idempotent)
    console.log('2. Funding test account with weETH via whale impersonation...')
    const weETHAmount = parseEther('5') // 5 weETH - sufficient for testing

    // Idempotency: if already funded, skip
    const existingBalance = (await publicClient.readContract({
      address: WEETH_ADDRESS,
      abi: WETH_ABI,
      functionName: 'balanceOf',
      args: [TEST_ACCOUNT.address],
    })) as bigint
    if (existingBalance >= weETHAmount) {
      console.log('✅ Test account already has sufficient weETH; skipping transfer')
      return true
    }

    // Check whale's weETH balance first
    const whaleBalance = (await publicClient.readContract({
      address: WEETH_ADDRESS,
      abi: WETH_ABI,
      functionName: 'balanceOf',
      args: [WEETH_WHALE],
    })) as bigint
    console.log(
      `Whale weETH balance: ${whaleBalance.toString()} (${whaleBalance / BigInt(10 ** 18)} weETH)`,
    )

    if (whaleBalance < weETHAmount) {
      throw new Error(
        `Whale has insufficient weETH balance: ${whaleBalance / BigInt(10 ** 18)} weETH`,
      )
    }

    // Impersonate the whale
    await testClient.impersonateAccount({
      address: WEETH_WHALE,
    })
    console.log('✅ Whale account impersonated')

    // Set whale's ETH balance for gas
    await testClient.setBalance({
      address: WEETH_WHALE,
      value: parseEther('100'),
    })
    console.log('✅ Whale ETH balance set to 100 ETH')

    // Transfer weETH from whale to test account
    const { request } = await publicClient.simulateContract({
      address: WEETH_ADDRESS,
      abi: WETH_ABI,
      functionName: 'transfer',
      args: [TEST_ACCOUNT.address, weETHAmount],
      account: WEETH_WHALE,
    })

    const walletClient = createWalletClient({
      chain: base,
      transport: http(ANVIL_RPC_URL),
      account: TEST_ACCOUNT,
    })
    let hash: `0x${string}` | undefined
    try {
      hash = await walletClient.writeContract(request)
      console.log(`Transfer transaction hash: ${hash}`)
    } catch (err: any) {
      const msg = err?.message ?? ''
      const alreadyImported =
        /Nonce provided/.test(msg) || /transaction already imported/i.test(msg)
      if (alreadyImported) {
        // Another parallel job likely sent the same tx. Re-check recipient balance.
        const postBalance = (await publicClient.readContract({
          address: WEETH_ADDRESS,
          abi: WETH_ABI,
          functionName: 'balanceOf',
          args: [TEST_ACCOUNT.address],
        })) as bigint
        if (postBalance >= weETHAmount) {
          console.log('ℹ️ Detected duplicate funding tx; balance is sufficient, continuing')
        } else {
          throw err
        }
      } else {
        throw err
      }
    }

    if (hash) {
      // Wait for transaction with an explicit timeout so CI won't hang indefinitely
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 })
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`)
    }

    // Stop impersonating
    await testClient.stopImpersonatingAccount({
      address: WEETH_WHALE,
    })
    console.log('✅ Stopped impersonating whale')

    // Step 4: Verify weETH balance
    const weETHBalance = (await publicClient.readContract({
      address: WEETH_ADDRESS,
      abi: WETH_ABI,
      functionName: 'balanceOf',
      args: [TEST_ACCOUNT.address],
    })) as bigint

    console.log(
      `✅ Test account weETH balance: ${weETHBalance.toString()} (${weETHBalance / BigInt(10 ** 18)} weETH)`,
    )

    if (weETHBalance >= BigInt(100000000000)) {
      // ~0.0001 weETH in wei, accept any reasonable amount
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

// Only auto-run when executed directly, not when imported by global setup
try {
  // import.meta.url is the absolute file:// URL for this module in ESM
  // process.argv[1] is the path of the executed file
  if (typeof import.meta !== 'undefined' && typeof process !== 'undefined') {
    const executedPath = `file://${process.argv[1]}`
    if (import.meta.url === executedPath) {
      // Run as a CLI helper
      fundTestAccount()
        .then((success) => {
          console.log('\n🎯 Funding result:', success ? 'SUCCESS' : 'FAILED')
          process.exit(success ? 0 : 1)
        })
        .catch((error) => {
          console.error('❌ Unexpected error:', error)
          process.exit(1)
        })
    }
  }
} catch {
  // Ignore if environment doesn't support import.meta or process (shouldn't happen in Node)
}
