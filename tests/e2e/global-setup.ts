import { spawn } from 'node:child_process'
import { shouldSkipAnvilStartup } from '../shared/backend'
import { ADDR } from '../shared/env'
import { topUpErc20, topUpNative } from '../shared/funding'

// Test address used by mock connector (Anvil default account #0)
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

/**
 * Global setup for Playwright E2E tests
 * Ensures Anvil Base fork is running before tests start
 */
async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...')

  // Skip Anvil startup if using non-Anvil backend (e.g., explicit RPC URL or Tenderly)
  if (shouldSkipAnvilStartup()) {
    console.log('🔗 Non-Anvil backend detected. Skipping Anvil startup.')
    await fundForE2E()
    return
  }

  // Check if Anvil is already running on port 8545
  const isAnvilRunning = await checkAnvilRunning()
  if (isAnvilRunning) {
    console.log('✅ Anvil is already running on port 8545')
    return
  }

  console.log('🚀 Starting Anvil Base fork for E2E tests...')

  // Get the Base RPC URL from environment
  const baseRpcUrl = process.env['ANVIL_BASE_FORK_URL']
  if (!baseRpcUrl) {
    console.warn('⚠️  ANVIL_BASE_FORK_URL not set, using public Base RPC (may hit rate limits)')
    console.warn('   For reliable CI, set ANVIL_BASE_FORK_URL to a dedicated RPC endpoint')
  }

  const finalRpcUrl = baseRpcUrl || 'https://mainnet.base.org'
  console.log(`🔗 Using Base RPC URL: ${finalRpcUrl}`)

  // Start Anvil in the background
  const anvilProcess = spawn(
    'anvil',
    [
      '--fork-url',
      finalRpcUrl,
      '--port',
      '8545',
      '--block-time',
      '1',
      '--no-rate-limit',
      '--silent', // Reduce noise in test output
    ],
    {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout and stderr
    },
  )

  // Log any errors from Anvil
  anvilProcess.stderr?.on('data', (data) => {
    console.error(`❌ Anvil stderr: ${data}`)
  })

  anvilProcess.on('error', (error) => {
    console.error(`❌ Failed to start Anvil process: ${error.message}`)
  })

  anvilProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`❌ Anvil exited with code ${code}`)
    }
    if (signal) {
      console.error(`❌ Anvil killed with signal ${signal}`)
    }
  })

  // Don't keep the process alive when parent exits
  anvilProcess.unref()

  // Wait for Anvil to start up with a short poll loop
  console.log('⏳ Waiting for Anvil to start...')
  const start = Date.now()
  let isNowRunning = false
  for (let i = 0; i < 15; i++) {
    // try up to ~7.5s
    // eslint-disable-next-line no-await-in-loop
    isNowRunning = await checkAnvilRunning()
    if (isNowRunning) break
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 500))
  }
  if (!isNowRunning) {
    throw new Error(
      'Failed to start Anvil. Please check your ANVIL_BASE_FORK_URL and ensure Foundry is installed.',
    )
  }
  console.log(`✅ Anvil Base fork is running and ready for E2E tests (in ${Date.now() - start}ms)`)

  console.log('✅ Anvil Base fork is running and ready for E2E tests')

  // Fund the test account with ETH (gas) and weETH (deposit asset)
  await fundForE2E()
}

/**
 * Check if Anvil is running on port 8545
 */
async function checkAnvilRunning(): Promise<boolean> {
  try {
    // Try to make a JSON-RPC call to localhost:8545
    const response = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    })

    if (!response.ok) return false

    const data = await response.json()
    // Base chain ID is 0x2105 (8453 in decimal)
    return data.result === '0x2105'
  } catch {
    return false
  }
}

export default globalSetup

async function fundForE2E() {
  try {
    console.log('🔧 Funding test account for E2E (ETH + weETH)...')
    await topUpNative(TEST_ADDRESS as any, '10')
    await topUpErc20(ADDR.weeth, TEST_ADDRESS as any, '5')
    console.log('✅ Funding complete')
  } catch (error) {
    console.error('⚠️  Failed to fund test account for E2E:', error)
  }
}
