#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import process from 'node:process'
// Import the Tenderly VNet helper (explicit .ts for Bun execution)
import { createVNet, deleteVNet } from './tenderly-vnet.ts'

type TestType = 'e2e' | 'integration'

interface TenderlyConfig {
  account: string
  project: string
  accessKey: string
  token?: string
  chainId: string
}

function getTenderlyConfig(): TenderlyConfig | null {
  const account = process.env.TENDERLY_ACCOUNT || process.env.TENDERLY_ACCOUNT_SLUG
  const project = process.env.TENDERLY_PROJECT || process.env.TENDERLY_PROJECT_SLUG
  const accessKey = process.env.TENDERLY_ACCESS_KEY
  const chainId = process.env.TENDERLY_CHAIN_ID || '8453'

  if (!account || !project || !accessKey) {
    return null
  }

  return {
    account,
    project,
    accessKey,
    token: process.env.TENDERLY_TOKEN,
    chainId,
  }
}

function getTestCommand(testType: TestType): { cmd: string; args: string[] } {
  switch (testType) {
    case 'e2e':
      return { cmd: 'bunx', args: ['playwright', 'test'] }
    case 'integration':
      // Call Vitest directly to avoid script recursion when test:integration itself uses this runner
      return {
        cmd: 'bunx',
        args: ['vitest', '-c', 'vitest.integration.config.ts', '--run', 'tests/integration'],
      }
    default:
      throw new Error(`Unknown test type: ${testType}`)
  }
}

let deterministicOverrideCache: string | null = null

function loadDeterministicOverride(): string | null {
  if (deterministicOverrideCache !== null) return deterministicOverrideCache

  try {
    const candidatePath = resolve(process.cwd(), 'tests/shared/tenderly-addresses.json')
    if (!existsSync(candidatePath)) {
      deterministicOverrideCache = null
      return deterministicOverrideCache
    }

    deterministicOverrideCache = readFileSync(candidatePath, 'utf8')
    return deterministicOverrideCache
  } catch (error) {
    console.warn('[run-tests] Unable to load deterministic Tenderly overrides', error)
    deterministicOverrideCache = null
    return deterministicOverrideCache
  }
}

function injectAddressOverrides(env: Record<string, string>): Record<string, string> {
  const explicitOverride =
    process.env.VITE_CONTRACT_ADDRESS_OVERRIDES ||
    process.env.TENDERLY_CONTRACT_ADDRESS_OVERRIDES ||
    loadDeterministicOverride()

  if (!explicitOverride) {
    return env
  }

  return {
    ...env,
    VITE_CONTRACT_ADDRESS_OVERRIDES: explicitOverride,
  }
}

async function runCommand(cmd: string, args: string[], env: Record<string, string>) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: injectAddressOverrides(env) })
    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`Child terminated with signal ${signal}`))
      if (code !== 0) return reject(new Error(`Child exited with code ${code}`))
      resolve()
    })
    child.on('error', reject)
  })
}

async function main() {
  const testType = process.argv[2] as TestType
  if (!testType || !['e2e', 'integration'].includes(testType)) {
    console.error('Usage: bun scripts/run-tests.ts [e2e|integration]')
    process.exit(1)
  }

  // Check for explicit TEST_RPC_URL override
  const explicitRpcUrl = process.env.TEST_RPC_URL
  if (explicitRpcUrl) {
    console.log(`🔗 Using explicit RPC URL: ${explicitRpcUrl}`)
    const { cmd, args } = getTestCommand(testType)
    const env = { ...process.env, TEST_RPC_URL: explicitRpcUrl }
    await runCommand(cmd, args, env)
    return
  }

  // Try to get Tenderly config
  const tenderlyConfig = getTenderlyConfig()
  if (!tenderlyConfig) {
    console.log('⚠️  No Tenderly configuration found. Falling back to Anvil (make sure it\'s running on port 8545)')
    const { cmd, args } = getTestCommand(testType)
    const env = { ...process.env, TEST_RPC_URL: 'http://127.0.0.1:8545' }
    await runCommand(cmd, args, env)
    return
  }

  // Use Tenderly JIT VNet
  console.log(`⏳ Creating Tenderly fork for ${testType} tests...`)
  const { id, rpcUrl } = await createVNet(tenderlyConfig)
  console.log(`✅ Fork created: ${id}`)
  console.log(`🔗 RPC: ${rpcUrl}`)

  try {
    const { cmd, args } = getTestCommand(testType)
    const env = { ...process.env, TEST_RPC_URL: rpcUrl }
    console.log(`🚀 Running ${testType} tests against Tenderly fork...`)
    await runCommand(cmd, args, env)
  } finally {
    console.log('🧹 Deleting Tenderly fork...')
    await deleteVNet({ ...tenderlyConfig, id })
    console.log('✅ Fork deleted')
  }
}

main().catch((err) => {
  console.error(`❌ Error in ${process.argv[2] || 'test'} runner:`, err)
  process.exit(1)
})
