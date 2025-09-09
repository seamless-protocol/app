#!/usr/bin/env node
const { spawn } = require('node:child_process')
const { createFork, deleteFork } = require('./tenderly-vnet.cjs')

async function main() {
  const account = process.env['TENDERLY_ACCOUNT'] || process.env['TENDERLY_ACCOUNT_SLUG']
  const project = process.env['TENDERLY_PROJECT'] || process.env['TENDERLY_PROJECT_SLUG']
  const accessKey = process.env['TENDERLY_ACCESS_KEY']
  const chainId = process.env['TENDERLY_CHAIN_ID'] || '8453'
  if (!account || !project || !accessKey) {
    console.error('Missing Tenderly env. Require TENDERLY_ACCOUNT, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY')
    process.exit(1)
  }

  console.log('⏳ Creating Tenderly fork...')
  const { id, rpcUrl } = await createFork({ account, project, accessKey, chainId })
  console.log(`✅ Fork created: ${id}`)
  console.log(`🔗 RPC: ${rpcUrl}`)

  const env = { ...process.env, TEST_RPC_URL: rpcUrl, TENDERLY_RPC_URL: rpcUrl }
  const cmd = 'bunx'
  const args = ['playwright', 'test']

  console.log('🚀 Running E2E tests against Tenderly fork...')
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env })
    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`Child terminated with signal ${signal}`))
      if (code !== 0) return reject(new Error(`Child exited with code ${code}`))
      resolve()
    })
    child.on('error', reject)
  })

  console.log('🧹 Deleting Tenderly fork...')
  await deleteFork({ account, project, accessKey, id })
  console.log('✅ Fork deleted')
}

main().catch(async (err) => {
  console.error('❌ Error in Tenderly E2E runner:', err)
  process.exit(1)
})

