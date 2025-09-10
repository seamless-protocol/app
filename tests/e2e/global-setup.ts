/**
 * Global setup for Playwright E2E tests
 *
 * Default: Tenderly VNet (automatic JIT creation)
 * Fallback: Local Anvil if TEST_RPC_URL=http://127.0.0.1:8545
 */
async function globalSetup() {
  const testRpcUrl = process.env['TEST_RPC_URL']

  // If using Tenderly VNet (default), no setup needed - VNets are created JIT during tests
  if (!testRpcUrl) {
    console.log('🚀 Using Tenderly VNet backend (JIT) - no setup required')
    return
  }

  // If using explicit non-Anvil RPC, just validate it's reachable
  if (!testRpcUrl.includes('127.0.0.1') && !testRpcUrl.includes('localhost')) {
    console.log(`🔗 Using external RPC: ${testRpcUrl}`)
    return
  }

  // Only remaining case: local Anvil - check if it's running
  console.log('🔧 Checking local Anvil...')

  const isRunning = await checkAnvilRunning()
  if (!isRunning) {
    throw new Error(
      '❌ Anvil not running on localhost:8545.\n' +
        '   Start it with: ANVIL_BASE_FORK_URL=<your-base-rpc> bun run anvil:base\n' +
        '   Or use Tenderly VNet by not setting TEST_RPC_URL',
    )
  }

  console.log('✅ Anvil is running and ready')
}

async function checkAnvilRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    })

    if (!response.ok) return false
    const data = await response.json()
    return data.result === '0x2105' // Base chain ID
  } catch {
    return false
  }
}

export default globalSetup
