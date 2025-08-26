/*
 Run integration + E2E tests on a single ephemeral Tenderly VirtualNet.

 Env (auth & config):
 - TENDERLY_ACCESS_KEY or TENDERLY_TOKEN
 - TENDERLY_ACCOUNT, TENDERLY_PROJECT
 - Optional creation knobs (same as the integration-only script):
   - TENDERLY_VNET_URL (reuse existing RPC, skip create/delete)
   - TENDERLY_VNET_CREATE_JSON (full JSON body override)
   - TENDERLY_VNET_MODE=fork|template (default fork)
   - TENDERLY_FORK_NETWORK_ID=8453 (default 8453 Base)
   - TENDERLY_VNET_TEMPLATE=base-mainnet
   - TENDERLY_VNET_BLOCK=latest|<hex>|<decimal>
*/

import { spawn } from 'node:child_process'

type CreateVNetResp = { id: string; rpc_url: string }

async function createVNet() {
  const key = process.env.TENDERLY_ACCESS_KEY
  const bearer = process.env.TENDERLY_TOKEN
  const account = process.env.TENDERLY_ACCOUNT
  const project = process.env.TENDERLY_PROJECT
  const block = process.env.TENDERLY_VNET_BLOCK ?? 'latest'

  if ((!key && !bearer) || !account || !project) {
    throw new Error('Missing Tenderly env. Set TENDERLY_ACCESS_KEY or TENDERLY_TOKEN, and TENDERLY_ACCOUNT, TENDERLY_PROJECT')
  }

  const override = process.env.TENDERLY_VNET_CREATE_JSON
  let body: Record<string, unknown>
  if (override) {
    try {
      body = JSON.parse(override)
    } catch (e) {
      throw new Error(`Invalid TENDERLY_VNET_CREATE_JSON: ${(e as Error).message}`)
    }
  } else {
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
  return { id, rpc_url: rpcUrl } satisfies CreateVNetResp
}

async function deleteVNet(id: string) {
  const key = process.env.TENDERLY_ACCESS_KEY
  const bearer = process.env.TENDERLY_TOKEN
  const account = process.env.TENDERLY_ACCOUNT!
  const project = process.env.TENDERLY_PROJECT!
  await fetch(
    `https://api.tenderly.co/api/v1/account/${account}/project/${project}/vnets/${id}`,
    {
      method: 'DELETE',
      headers: {
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(key && !bearer ? { 'X-Access-Key': key } : {}),
      },
    },
  ).catch(() => {})
}

function runCommand(cmd: string, args: string[], env: Record<string, string | undefined>) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`))))
    child.on('error', reject)
  })
}

async function runIntegration(rpcUrl: string) {
  await runCommand('bun', ['run', 'test:integration'], { TEST_RPC_KIND: 'tenderly', TEST_RPC_URL: rpcUrl })
}

async function runE2E(rpcUrl: string) {
  await runCommand('bun', ['run', 'test:e2e'], { TEST_RPC_KIND: 'tenderly', TEST_RPC_URL: rpcUrl })
}

async function main() {
  const presetUrl = process.env.TENDERLY_VNET_URL
  let vnet: CreateVNetResp | null = null
  let rpcUrl: string
  if (presetUrl) {
    console.log('Using provided Tenderly VNet URL:', presetUrl)
    rpcUrl = presetUrl
  } else {
    vnet = await createVNet()
    console.log('Created Tenderly VirtualNet:', vnet)
    rpcUrl = vnet.rpc_url
  }

  const cleanup = async () => {
    if (vnet) {
      console.log('Deleting Tenderly VirtualNet:', vnet.id)
      await deleteVNet(vnet.id)
    }
  }
  process.on('SIGINT', () => void cleanup().then(() => process.exit(130)))
  process.on('SIGTERM', () => void cleanup().then(() => process.exit(143)))

  try {
    await runIntegration(rpcUrl)
    await runE2E(rpcUrl)
  } finally {
    await cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

