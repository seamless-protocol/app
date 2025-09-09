#!/usr/bin/env node
const { spawn } = require('node:child_process')
const { createVNet, deleteVNet } = require('./tenderly-vnet.cjs')

async function main() {
  // Enforce: do not allow persistent VNet RPCs in CI (state persistence causes flakes)
  const vnetRpc = process.env['TENDERLY_VNET_RPC']
  if (vnetRpc) {
    const allowLocal = process.env['ALLOW_VNET'] === '1' && !process.env['GITHUB_ACTIONS'] && !process.env['CI']
    if (!allowLocal) {
      throw new Error(
        'TENDERLY_VNET_RPC is not allowed for automated tests (state persists across runs). ' +
          'Unset TENDERLY_VNET_RPC. For local debugging only, set ALLOW_VNET=1 to bypass (never in CI).',
      )
    }
    console.warn('⚠️ Using provided Tenderly VNet RPC for local debugging (no fork create/delete):', vnetRpc)
    const env = { ...process.env, TEST_RPC_URL: vnetRpc, TENDERLY_RPC_URL: vnetRpc }
    await new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'test:integration'], { stdio: 'inherit', env })
      child.on('exit', (code, signal) => {
        if (signal) return reject(new Error(`Child terminated with signal ${signal}`))
        if (code !== 0) return reject(new Error(`Child exited with code ${code}`))
        resolve()
      })
      child.on('error', reject)
    })
    return
  }
  const account = process.env['TENDERLY_ACCOUNT'] || process.env['TENDERLY_ACCOUNT_SLUG']
  const project = process.env['TENDERLY_PROJECT'] || process.env['TENDERLY_PROJECT_SLUG']
  const accessKey = process.env['TENDERLY_ACCESS_KEY']
  const chainId = process.env['TENDERLY_CHAIN_ID'] || '8453'
  if (!account || !project || !accessKey) {
    console.error('Missing Tenderly env. Require TENDERLY_ACCOUNT, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY')
    process.exit(1)
  }

  console.log('⏳ Creating Tenderly fork for integration tests...')
  const token = process.env['TENDERLY_TOKEN']
  const { id, rpcUrl } = await createVNet({ account, project, accessKey, token, chainId })
  console.log(`✅ Fork created: ${id}`)
  console.log(`🔗 RPC: ${rpcUrl}`)

  const env = { ...process.env, TEST_RPC_URL: rpcUrl, TENDERLY_RPC_URL: rpcUrl }
  console.log('🚀 Running integration tests against Tenderly fork...')
  await new Promise((resolve, reject) => {
    const child = spawn('bun', ['run', 'test:integration'], { stdio: 'inherit', env })
    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`Child terminated with signal ${signal}`))
      if (code !== 0) return reject(new Error(`Child exited with code ${code}`))
      resolve()
    })
    child.on('error', reject)
  })

  console.log('🧹 Deleting Tenderly fork...')
  await deleteVNet({ account, project, accessKey, token, id })
  console.log('✅ Fork deleted')
}

main().catch(async (err) => {
  console.error('❌ Error in Tenderly integration runner:', err)
  process.exit(1)
})
