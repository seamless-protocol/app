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
  const account = process.env.TENDERLY_ACCOUNT
  const project = process.env.TENDERLY_PROJECT
  const template = process.env.TENDERLY_VNET_TEMPLATE ?? 'base-mainnet'
  const block = process.env.TENDERLY_VNET_BLOCK

  if (!key || !account || !project) {
    throw new Error('Missing Tenderly env. Set TENDERLY_ACCESS_KEY, TENDERLY_ACCOUNT, TENDERLY_PROJECT')
  }

  const body: Record<string, unknown> = {
    display_name: `local-${Date.now()}`,
    virtual_network_template: template,
  }
  if (block) body['block_number'] = Number(block)

  const res = await fetch(
    `https://api.tenderly.co/api/v1/account/${account}/project/${project}/vnets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': key,
      },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Create VNet failed: ${res.status} ${text}`)
  }
  const json = (await res.json()) as CreateVNetResp
  if (!json.id || !json.rpc_url) throw new Error('Invalid VNet response')
  return json
}

async function deleteVNet(id: string) {
  const key = process.env.TENDERLY_ACCESS_KEY!
  const account = process.env.TENDERLY_ACCOUNT!
  const project = process.env.TENDERLY_PROJECT!
  await fetch(
    `https://api.tenderly.co/api/v1/account/${account}/project/${project}/vnets/${id}`,
    { method: 'DELETE', headers: { 'X-Access-Key': key } },
  ).catch(() => {})
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
  const vnet = await createVNet()
  console.log('Created Tenderly VirtualNet:', vnet)

  const cleanup = async () => {
    console.log('Deleting Tenderly VirtualNet:', vnet.id)
    await deleteVNet(vnet.id)
  }
  process.on('SIGINT', () => void cleanup().then(() => process.exit(130)))
  process.on('SIGTERM', () => void cleanup().then(() => process.exit(143)))

  try {
    await runTests(vnet.rpc_url)
  } finally {
    await cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

