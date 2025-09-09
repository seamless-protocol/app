import { spawn } from 'node:child_process'

// Test address used by mock connector (Anvil default account #0)
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
// weETH on Base (used for test funding)
const WEETH_ADDRESS = '0x04C0599Ae5A44757c0af6f9eC3b93da8976c150A'

/**
 * Global setup for Playwright E2E tests
 * Ensures Anvil Base fork is running before tests start
 */
async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...')

  // If Tenderly RPC is configured, skip starting Anvil and fund via admin RPC
  const tenderlyRpc = process.env['TEST_RPC_URL'] ?? process.env['TENDERLY_RPC_URL']
  if (tenderlyRpc) {
    console.log('🔗 TENDERLY_RPC_URL detected. Skipping Anvil startup.')
    await fundViaTenderly(tenderlyRpc)
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

  // Fund the test account with WETH for testing (Anvil path)
  try {
    const { fundTestAccount } = await import('./fund-test-account.js')
    const success = await fundTestAccount()
    if (!success) {
      console.error('⚠️  Failed to fund test account with WETH, tests may fail')
    }
  } catch (error) {
    console.error('⚠️  Failed to fund test account:', error)
  }
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

/**
 * Fund via Tenderly admin RPC
 */
async function fundViaTenderly(rpcUrl: string) {
  console.log('🔧 Funding mock account via Tenderly admin RPC...')
  // Helper to POST JSON-RPC
  async function rpc(method: string, params: Array<any>) {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    if (!res.ok) throw new Error(`RPC ${method} failed: HTTP ${res.status}`)
    const json = await res.json()
    if (json.error) throw new Error(`RPC ${method} error: ${JSON.stringify(json.error)}`)
    return json.result
  }

  // 1) Set ETH balance (10 ETH)
  const eth = 10n * 10n ** 18n
  const toHex = (x: bigint) => `0x${x.toString(16)}`
  await rpc('tenderly_setBalance', [TEST_ADDRESS, toHex(eth)])
  console.log('✅ Set ETH balance via Tenderly')

  // 2) Set weETH ERC20 balance (10 weETH)
  const weeth = 10n * 10n ** 18n
  await rpc('tenderly_setErc20Balance', [WEETH_ADDRESS, TEST_ADDRESS, toHex(weeth)])
  console.log('✅ Set weETH balance via Tenderly')
}
