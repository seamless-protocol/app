/*
 Run integration tests on an ephemeral Tenderly VirtualNet.

 Required env:
 - TENDERLY_ACCESS_KEY
 - TENDERLY_ACCOUNT
 - TENDERLY_PROJECT

 Optional env:
 - TENDERLY_VNET_TEMPLATE (default: base-mainnet)
 - TENDERLY_VNET_BLOCK (pin to a block number)
*/

import { spawn } from 'node:child_process'

type CreateVNetResp = { id: string; rpc_url: string }

async function createVNet() {
  const key = process.env.TENDERLY_ACCESS_KEY
  const bearer = process.env.TENDERLY_TOKEN
  const account = process.env.TENDERLY_ACCOUNT
  const project = process.env.TENDERLY_PROJECT
  const template = process.env.TENDERLY_VNET_TEMPLATE ?? 'base-mainnet'
  const block = process.env.TENDERLY_VNET_BLOCK ?? 'latest'

  if (!key || !account || !project) {
    throw new Error('Missing Tenderly env. Set TENDERLY_ACCESS_KEY, TENDERLY_ACCOUNT, TENDERLY_PROJECT')
  }

  // Allow full override via env for maximum compatibility with Tenderly API versions/plans
  const override = process.env.TENDERLY_VNET_CREATE_JSON
  let body: Record<string, unknown>
  if (override) {
    try {
      body = JSON.parse(override)
    } catch (e) {
      throw new Error(`Invalid TENDERLY_VNET_CREATE_JSON: ${(e as Error).message}`)
    }
  } else {
    const mode = (process.env.TENDERLY_VNET_MODE ?? 'fork').toLowerCase()
    const nid = Number(process.env.TENDERLY_FORK_NETWORK_ID ?? '8453')
    // Normalize block number to string, allowing decimal or hex or 'latest'
    let blockNumber: string | undefined = block
    if (block && block !== 'latest' && !block.startsWith('0x')) {
      const n = Number(block)
      if (!Number.isNaN(n)) blockNumber = `0x${n.toString(16)}`
    }
    const slug = `local-${Date.now()}`
    body = {
      slug,
      display_name: slug,
      fork_config: {
        network_id: nid,
        ...(blockNumber ? { block_number: blockNumber } : {}),
      },
      virtual_network_config: {
        chain_config: { chain_id: nid },
      },
      sync_state_config: { enabled: false },
      explorer_page_config: { enabled: false, verification_visibility: 'bytecode' },
    }
  }

  const res = await fetch(
    `https://api.tenderly.co/api/v1/account/${account}/project/${project}/vnets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(key && !bearer ? { 'X-Access-Key': key } : {}),
      },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Create VNet failed: ${res.status} ${text}`)
  }
  const json = (await res.json()) as any
  // Try common response shapes
  const id = json.id ?? json.virtual_network?.id ?? json.vnet?.id
  let rpcUrl = json.rpc_url ?? json.endpoints?.rpc ?? json.virtual_network?.rpc_url
  if (!rpcUrl && Array.isArray(json.rpcs)) {
    const admin = json.rpcs.find((r: any) => r.name?.toLowerCase().includes('admin') && r.url)
    const pub = json.rpcs.find((r: any) => r.name?.toLowerCase().includes('public') && r.url)
    rpcUrl = admin?.url ?? pub?.url ?? json.rpcs[0]?.url
  }
  if (!id || !rpcUrl) {
    console.error('Unexpected VNet response:', JSON.stringify(json, null, 2))
    throw new Error('Invalid VNet response')
  }
  return { id, rpc_url: rpcUrl }
}

async function deleteVNet(id: string) {
  const key = process.env.TENDERLY_ACCESS_KEY
  const bearer = process.env.TENDERLY_TOKEN
  const account = process.env.TENDERLY_ACCOUNT!
  const project = process.env.TENDERLY_PROJECT!
  
  try {
    const response = await fetch(
      `https://api.tenderly.co/api/v1/account/${account}/project/${project}/vnets/${id}`,
      {
        method: 'DELETE',
        headers: {
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
          ...(key && !bearer ? { 'X-Access-Key': key } : {}),
        },
      },
    )
    
    if (response.ok) {
      console.log(`✅ Successfully deleted VNet: ${id}`)
    } else {
      const errorText = await response.text().catch(() => 'No response body')
      console.warn(`⚠️ VNet deletion returned ${response.status}: ${errorText}`)
    }
  } catch (error) {
    console.error(`❌ Failed to delete VNet ${id}:`, error)
  }
}

function runTests(rpcUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('bun', ['run', 'test:integration'], {
      stdio: 'inherit',
      env: { ...process.env, TEST_RPC_KIND: 'tenderly', TEST_RPC_URL: rpcUrl },
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Integration tests failed with code ${code}`))
    })
    child.on('error', reject)
  })
}

async function main() {
  // If a VNet URL is provided, use it directly (no creation/deletion)
  const presetUrl = process.env.TENDERLY_VNET_URL
  let vnet: { id: string; rpc_url: string } | null = null
  if (presetUrl) {
    console.log('Using provided Tenderly VNet URL:', presetUrl)
  } else {
    vnet = await createVNet()
    console.log('Created Tenderly VirtualNet:', vnet)
  }

  const cleanup = async () => {
    if (vnet) {
      console.log('🧹 Cleaning up Tenderly VirtualNet:', vnet.id)
      await deleteVNet(vnet.id)
      console.log('🧹 Cleanup completed')
    } else {
      console.log('🧹 No VNet to clean up (using preset URL)')
    }
  }
  process.on('SIGINT', () => void cleanup().then(() => process.exit(130)))
  process.on('SIGTERM', () => void cleanup().then(() => process.exit(143)))

  try {
    await runTests(presetUrl ?? vnet!.rpc_url)
  } finally {
    await cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
