const API_BASE = 'https://api.tenderly.co/api/v1'

/** Create a Tenderly VirtualNet (recommended for CI) */
async function createVNet({ account, project, accessKey, token, chainId = '8453', block = 'latest' }) {
  const url = `${API_BASE}/account/${account}/project/${project}/vnets`
  let blockNumber = block
  if (block && block !== 'latest' && !String(block).startsWith('0x')) {
    const n = Number(block)
    if (!Number.isNaN(n)) blockNumber = `0x${n.toString(16)}`
  }
  const slug = `ci-${Date.now()}`
  const body = {
    slug,
    display_name: slug,
    fork_config: {
      network_id: Number(chainId),
      ...(blockNumber ? { block_number: blockNumber } : {}),
    },
    virtual_network_config: {
      chain_config: { chain_id: Number(chainId) },
    },
    sync_state_config: { enabled: false },
    explorer_page_config: { enabled: false, verification_visibility: 'bytecode' },
  }
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(accessKey && !token ? { 'X-Access-Key': accessKey } : {}),
  }
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to create VNet: HTTP ${res.status} ${res.statusText} — ${text}`)
  }
  const json = await res.json().catch(() => ({}))
  const id = json.id || json.virtual_network?.id || json.vnet?.id
  let rpcUrl = json.rpc_url || json.endpoints?.rpc || json.virtual_network?.rpc_url
  if (!rpcUrl && Array.isArray(json.rpcs)) {
    const admin = json.rpcs.find((r) => r?.name?.toLowerCase?.().includes('admin') && r.url)
    const pub = json.rpcs.find((r) => r?.name?.toLowerCase?.().includes('public') && r.url)
    rpcUrl = admin?.url || pub?.url || json.rpcs[0]?.url
  }
  if (!id || !rpcUrl) {
    throw new Error(`VNet response missing id/rpc_url: ${JSON.stringify(json)}`)
  }
  return { id, rpcUrl }
}

async function deleteVNet({ account, project, accessKey, token, id }) {
  const url = `${API_BASE}/account/${account}/project/${project}/vnets/${id}`
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(accessKey && !token ? { 'X-Access-Key': accessKey } : {}),
  }
  const res = await fetch(url, { method: 'DELETE', headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to delete VNet ${id}: HTTP ${res.status} ${res.statusText} — ${text}`)
  }
}

// Back-compat names for importers that still call createFork/deleteFork
async function createFork(args) {
  return await createVNet(args)
}
async function deleteFork(args) {
  return await deleteVNet(args)
}

module.exports = { createVNet, deleteVNet, createFork, deleteFork }
