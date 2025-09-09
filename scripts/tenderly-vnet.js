// Node script to create and delete a Tenderly fork (JIT) around a child process
// Env required: TENDERLY_ACCOUNT_SLUG, TENDERLY_PROJECT_SLUG, TENDERLY_ACCESS_KEY
// Optional: TENDERLY_CHAIN_ID (default 8453 for Base)

const API_BASE = 'https://api.tenderly.co/api/v1'

async function createFork({ account, project, accessKey, chainId = '8453' }) {
  const res = await fetch(`${API_BASE}/account/${account}/project/${project}/forks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Access-Key': accessKey },
    body: JSON.stringify({ network_id: chainId }),
  })
  if (!res.ok) throw new Error(`Failed to create fork: HTTP ${res.status}`)
  const json = await res.json()
  const id = json?.simulation_fork?.id || json?.id
  if (!id) throw new Error('Fork id not found in response')
  const rpcUrl = json?.simulation_fork?.rpc_url || `https://rpc.tenderly.co/fork/${id}`
  return { id, rpcUrl }
}

async function deleteFork({ account, project, accessKey, id }) {
  const res = await fetch(`${API_BASE}/account/${account}/project/${project}/forks/${id}`, {
    method: 'DELETE',
    headers: { 'X-Access-Key': accessKey },
  })
  if (!res.ok) throw new Error(`Failed to delete fork ${id}: HTTP ${res.status}`)
}

module.exports = { createFork, deleteFork }

