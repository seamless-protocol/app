#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import process from 'node:process'
// Import the Tenderly VNet helper (explicit .ts for Bun execution)
import { createVNet, deleteVNet } from './tenderly-vnet.ts'
import {
  BASE_TENDERLY_VNET_ADMIN_RPC,
  BASE_TENDERLY_VNET_PRIMARY_RPC,
  DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY,
  MAINNET_TENDERLY_VNET_ADMIN_RPC,
  MAINNET_TENDERLY_VNET_PRIMARY_RPC,
} from '../tests/fixtures/addresses'

type TestType = 'e2e' | 'integration'

type ChainSlug = 'base' | 'mainnet'

type ChainPreset = {
  label: string
  testRpc: string
  adminRpc: string
  tokenSource: string
  tokenKey: string
}

const CHAIN_PRESETS: Record<ChainSlug, ChainPreset> = {
  base: {
    label: 'Base (Tenderly VNet)',
    testRpc: BASE_TENDERLY_VNET_PRIMARY_RPC,
    adminRpc: BASE_TENDERLY_VNET_ADMIN_RPC,
    tokenSource: 'tenderly',
    tokenKey: DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY,
  },
  mainnet: {
    label: 'Mainnet (Tenderly VNet)',
    testRpc: MAINNET_TENDERLY_VNET_PRIMARY_RPC,
    adminRpc: MAINNET_TENDERLY_VNET_ADMIN_RPC,
    tokenSource: 'tenderly',
    tokenKey: 'cbbtc-usdc-2x',
  },
}

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

function getTestCommand(testType: TestType, extraArgs: string[] = []): { cmd: string; args: string[] } {
  switch (testType) {
    case 'e2e':
      return { cmd: 'bunx', args: ['playwright', 'test', ...extraArgs] }
    case 'integration':
      // Call Vitest directly to avoid script recursion when test:integration itself uses this runner
      return {
        cmd: 'bunx',
        args: ['vitest', '-c', 'vitest.integration.config.ts', '--run', 'tests/integration', ...extraArgs],
      }
    default:
      throw new Error(`Unknown test type: ${testType}`)
  }
}

function parseArguments(): {
  testType: TestType
  chainOption?: string
  passThroughArgs: string[]
} {
  const args = process.argv.slice(2)
  const rawType = args.shift() as TestType | undefined
  if (!rawType || !['e2e', 'integration'].includes(rawType)) {
    console.error('Usage: bun scripts/run-tests.ts [e2e|integration] [--chain <base|mainnet|all>] [extra args...]')
    process.exit(1)
  }

  let chainOption: string | undefined
  const passThroughArgs: string[] = []

  while (args.length > 0) {
    const arg = args.shift() as string
    if (arg === '--chain') {
      const value = args.shift()
      if (!value) {
        console.error('Missing value after --chain')
        process.exit(1)
      }
      chainOption = value
    } else if (arg.startsWith('--chain=')) {
      chainOption = arg.split('=')[1]
    } else {
      passThroughArgs.push(arg)
    }
  }

  return { testType: rawType, chainOption, passThroughArgs }
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
  const { testType, chainOption, passThroughArgs } = parseArguments()

  if (chainOption) {
    await runForChainOption(chainOption, testType, passThroughArgs)
    return
  }

  // Check for explicit TEST_RPC_URL override
  const explicitRpcUrl = process.env.TEST_RPC_URL
  if (explicitRpcUrl) {
    console.log(`🔗 Using explicit RPC URL: ${explicitRpcUrl}`)
    const { cmd, args } = getTestCommand(testType, passThroughArgs)
    const env = withTestDefaults(testType, { ...process.env, TEST_RPC_URL: explicitRpcUrl }, 'custom')
    await runCommand(cmd, args, env)
    return
  }

  // Try to get Tenderly config
  const tenderlyConfig = getTenderlyConfig()
  if (!tenderlyConfig) {
    console.log('⚠️  No Tenderly configuration found. Falling back to Anvil (make sure it\'s running on port 8545)')
    const { cmd, args } = getTestCommand(testType, passThroughArgs)
    const env = withTestDefaults(
      testType,
      { ...process.env, TEST_RPC_URL: 'http://127.0.0.1:8545' },
      'anvil',
    )
    await runCommand(cmd, args, env)
    return
  }

  // Use Tenderly JIT VNet
  console.log(`⏳ Creating Tenderly fork for ${testType} tests...`)
  const { id, rpcUrl } = await createVNet(tenderlyConfig)
  console.log(`✅ Fork created: ${id}`)
  console.log(`🔗 RPC: ${rpcUrl}`)

  try {
    const { cmd, args } = getTestCommand(testType, passThroughArgs)
    const env = withTestDefaults(testType, { ...process.env, TEST_RPC_URL: rpcUrl }, 'tenderly')
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

async function runForChainOption(chainOption: string, testType: TestType, passThroughArgs: string[]) {
  const slugs: Array<ChainSlug> =
    chainOption === 'all'
      ? (Object.keys(CHAIN_PRESETS) as Array<ChainSlug>)
      : ([chainOption] as Array<ChainSlug>)

  for (const slug of slugs) {
    const preset = CHAIN_PRESETS[slug]
    if (!preset) {
      console.error(`Unknown chain preset '${slug}'. Available: ${Object.keys(CHAIN_PRESETS).join(', ')}`)
      process.exit(1)
    }

    console.log(`\n=== 🚀 Running ${testType} tests [${preset.label}] ===`)
    const env = {
      ...process.env,
      TEST_RPC_URL: preset.testRpc,
      TENDERLY_ADMIN_RPC_URL: preset.adminRpc,
      E2E_TOKEN_SOURCE: preset.tokenSource,
      E2E_LEVERAGE_TOKEN_KEY: preset.tokenKey,
    }

    try {
      const { cmd, args } = getTestCommand(testType, passThroughArgs)
      await runCommand(cmd, args, withTestDefaults(testType, env, 'tenderly'))
      console.log(`=== ✅ ${preset.label} ===`)
    } catch (error) {
      console.error(`=== ❌ ${preset.label} failed ===`)
      throw error
    }
  }
}

function withTestDefaults(
  testType: TestType,
  env: Record<string, string>,
  backend: 'tenderly' | 'anvil' | 'custom',
): Record<string, string> {
  const isUiSuite = testType === 'e2e'
  const isChainAwareSuite = testType === 'e2e' || testType === 'integration'

  if (isChainAwareSuite && !env.VITE_INCLUDE_TEST_TOKENS) {
    if (backend === 'tenderly' || env.TEST_RPC_URL?.includes('tenderly')) {
      env.VITE_INCLUDE_TEST_TOKENS = 'true'
    }
  }

  if (isUiSuite && !env.E2E_TOKEN_SOURCE) {
    if (backend === 'tenderly') env.E2E_TOKEN_SOURCE = 'tenderly'
    else if (backend === 'anvil') env.E2E_TOKEN_SOURCE = 'prod'
    else if (env.TEST_RPC_URL?.includes('tenderly')) env.E2E_TOKEN_SOURCE = 'tenderly'
    else env.E2E_TOKEN_SOURCE = 'prod'
  }

  return env
}
