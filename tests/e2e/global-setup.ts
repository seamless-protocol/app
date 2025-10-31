import { BACKEND } from '../shared/env'

async function globalSetup() {
  console.info(`[Test][Backend] Using: ${BACKEND.mode}`)

  if (BACKEND.executionKind === 'tenderly') {
    console.log(`🚀 Using ${BACKEND.mode} backend (${BACKEND.rpcUrl}) — no local setup required`)
    return
  }

  console.log(`🔧 Using local backend at ${BACKEND.rpcUrl} — validating connectivity...`)
  const isReachable = await checkRpcHealth(BACKEND.rpcUrl, BACKEND.chainId)
  if (!isReachable) {
    throw new Error(
      `❌ RPC ${BACKEND.rpcUrl} not reachable.\n` +
        '   Start Anvil with: ANVIL_BASE_FORK_URL=https://mainnet.base.org bun run anvil:base\n' +
        '   Or run without TEST_MODE/Test overrides to use Tenderly JIT.',
    )
  }
  console.log('✅ Local RPC reachable; continuing')
}

async function checkRpcHealth(url: string, expectedChainId: number): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
    })
    if (!response.ok) return false
    const json = (await response.json()) as { result?: string }
    if (!json?.result) return false
    const chainId = Number(BigInt(json.result))
    return chainId === expectedChainId
  } catch (error) {
    console.warn('[global-setup] RPC health check failed', { url, error })
    return false
  }
}

export default globalSetup
