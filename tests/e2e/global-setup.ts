import { spawn } from 'node:child_process'
import { account } from '../shared/clients'
import { ENV } from '../shared/env'
import { fundNative, fundWeETH } from '../shared/funding'

/**
 * Global setup for Playwright E2E tests
 * Ensures Anvil Base fork is running before tests start
 */
async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...')

  if (ENV.RPC_KIND === 'anvil') {
    // Check if Anvil is already running on port 8545
    const isAnvilRunning = await checkAnvilRunning()
    if (!isAnvilRunning) {
      console.log('🚀 Starting Anvil Base fork for E2E tests...')
      const baseRpcUrl = process.env['ANVIL_BASE_FORK_URL'] || 'https://mainnet.base.org'
      console.log(`🔗 Using Base RPC URL: ${baseRpcUrl}`)
      const anvilProcess = spawn(
        'anvil',
        [
          '--fork-url',
          baseRpcUrl,
          '--port',
          '8545',
          '--block-time',
          '1',
          '--no-rate-limit',
          '--silent',
        ],
        // Fully detach and ignore stdio so Node event loop is not held open
        { detached: true, stdio: 'ignore' },
      )
      anvilProcess.unref()
      console.log('⏳ Waiting for Anvil to start...')
      await new Promise((r) => setTimeout(r, 3000))
      const up = await checkAnvilRunning()
      if (!up)
        throw new Error(
          'Failed to start Anvil. Check ANVIL_BASE_FORK_URL and Foundry installation.',
        )
      console.log('✅ Anvil Base fork is running and ready for E2E tests')
    } else {
      console.log('✅ Anvil is already running on port 8545')
    }
  } else {
    console.log('🔗 Using Tenderly RPC; skipping Anvil startup')
  }

  // Fund the mock wallet address with native and weETH for UI tests
  try {
    console.log(`🔧 Funding UI test account: ${account.address}`)
    await fundNative(account.address, '10')
    await fundWeETH(account.address, '2')
    console.log('✅ Funding complete')
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
