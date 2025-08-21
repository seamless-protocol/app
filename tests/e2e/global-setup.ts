import { spawn } from 'node:child_process'

/**
 * Global setup for Playwright E2E tests
 * Ensures Anvil Base fork is running before tests start
 */
async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...')

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
      stdio: 'ignore',
    },
  )

  // Don't keep the process alive when parent exits
  anvilProcess.unref()

  // Wait a moment for Anvil to start up
  console.log('⏳ Waiting for Anvil to start...')
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Verify Anvil is now running
  const isNowRunning = await checkAnvilRunning()
  if (!isNowRunning) {
    throw new Error(
      'Failed to start Anvil. Please check your ANVIL_BASE_FORK_URL and ensure Foundry is installed.',
    )
  }

  console.log('✅ Anvil Base fork is running and ready for E2E tests')
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
