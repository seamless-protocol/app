#!/usr/bin/env bun
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { z } from 'zod'
import { getContractAddresses } from '../src/lib/contracts/addresses'
import { resolveBackend } from '../tests/shared/backend'
// Import the Tenderly VNet helper (explicit .ts for Bun execution)
import { createVNet, deleteVNet } from './tenderly-vnet.ts'

type TestType = 'e2e' | 'integration'

type ChainSlug = 'base' | 'mainnet'

// Schema for the RPC URL map - handles both string URLs and objects with url property
const RpcUrlMapSchema = z.record(
  z.string(),
  z.union([z.string().url(), z.object({ url: z.string().url() }).transform((obj) => obj.url)]),
)

const testRpcUrlMap: Record<string, string> = (() => {
  const rawMap =
    process.env['VITE_TEST_RPC_URL_MAP'] || process.env['TEST_RPC_URL_MAP'] || undefined
  if (!rawMap) return {}

  try {
    const result = RpcUrlMapSchema.safeParse(JSON.parse(rawMap))
    if (!result.success) {
      console.warn('[run-tests] Invalid VITE_TEST_RPC_URL_MAP format:', result.error.format())
      return {}
    }
    return result.data
  } catch (error) {
    console.warn('[run-tests] Failed to parse VITE_TEST_RPC_URL_MAP', error)
    return {}
  }
})()

interface TenderlyConfig {
  account: string
  project: string
  accessKey: string
  token?: string
  chainId: string
}

function getTenderlyConfig(): TenderlyConfig | null {
  const account = process.env['TENDERLY_ACCOUNT'] || process.env['TENDERLY_ACCOUNT_SLUG']
  const project = process.env['TENDERLY_PROJECT'] || process.env['TENDERLY_PROJECT_SLUG']
  const accessKey = process.env['TENDERLY_ACCESS_KEY']
  const chainId = process.env['TENDERLY_CHAIN_ID'] || '8453'
  const token = process.env['TENDERLY_TOKEN']

  if (!account || !project || !accessKey) {
    return null
  }

  return {
    account,
    project,
    accessKey,
    chainId,
    ...(token ? { token } : {}),
  }
}

function getTestCommand(
  testType: TestType,
  extraArgs: Array<string> = [],
): { cmd: string; args: Array<string> } {
  switch (testType) {
    case 'e2e':
      return { cmd: 'bunx', args: ['playwright', 'test', ...extraArgs] }
    case 'integration':
      // Call Vitest directly to avoid script recursion when test:integration itself uses this runner
      return {
        cmd: 'bunx',
        args: [
          'vitest',
          '-c',
          'vitest.integration.config.ts',
          '--run',
          'tests/integration',
          ...extraArgs,
        ],
      }
    default:
      throw new Error(`Unknown test type: ${testType}`)
  }
}

function parseArguments(): {
  testType: TestType
  chainOption?: string
  passThroughArgs: Array<string>
} {
  const args = process.argv.slice(2)
  const rawType = args.shift() as TestType | undefined
  if (!rawType || !['e2e', 'integration'].includes(rawType)) {
    console.error(
      'Usage: bun scripts/run-tests.ts [e2e|integration] [--chain <base|mainnet|all>] [extra args...]',
    )
    process.exit(1)
  }

  let chainOption: string | undefined
  const passThroughArgs: Array<string> = []

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

  return {
    testType: rawType,
    ...(chainOption ? { chainOption } : {}),
    passThroughArgs,
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

function injectAddressOverrides(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const explicitOverride =
    process.env['VITE_CONTRACT_ADDRESS_OVERRIDES'] ||
    process.env['TENDERLY_CONTRACT_ADDRESS_OVERRIDES'] ||
    loadDeterministicOverride()

  if (!explicitOverride) {
    return env
  }

  return {
    ...env,
    VITE_CONTRACT_ADDRESS_OVERRIDES: explicitOverride,
  }
}

async function runCommand(cmd: string, args: Array<string>, env: NodeJS.ProcessEnv) {
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
  const explicitRpcUrl = process.env['TEST_RPC_URL']
  if (explicitRpcUrl) {
    console.log(`🔗 Using explicit RPC URL: ${explicitRpcUrl}`)
    const { cmd, args } = getTestCommand(testType, passThroughArgs)
    const env = withTestDefaults(
      testType,
      { ...process.env, TEST_RPC_URL: explicitRpcUrl },
      'custom',
    )
    await runCommand(cmd, args, env)
    return
  }

  // Try to get Tenderly config
  const tenderlyConfig = getTenderlyConfig()
  if (!tenderlyConfig) {
    console.log(
      "⚠️  No Tenderly configuration found. Falling back to Anvil (make sure it's running on port 8545)",
    )
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

async function runForChainOption(
  chainOption: string,
  testType: TestType,
  passThroughArgs: Array<string>,
) {
  const slugs: Array<ChainSlug> =
    chainOption === 'all'
      ? (['base', 'mainnet'] as Array<ChainSlug>)
      : ([chainOption] as Array<ChainSlug>)

  for (const slug of slugs) {
    const backend = await resolveBackend({
      chain: slug,
      mode: 'tenderly-static',
      scenario: 'leverage-mint',
    })
    const chainId = String(backend.canonicalChainId)
    const mappedRpc = testRpcUrlMap[chainId]
    const effectiveRpc = mappedRpc ?? backend.rpcUrl

    const label = `Run (${slug}, ${backend.mode})`

    console.log(`\n=== 🚀 Running ${testType} tests [${label}] ===`)
    if (mappedRpc) {
      console.log(`[run-tests] Overriding RPC for chain ${chainId}: ${mappedRpc}`)
    }

    const envSeed: Record<string, string> = {
      ...process.env,
      TEST_CHAIN: backend.chainKey,
      TEST_MODE: backend.mode,
      TEST_SCENARIO: backend.scenario.key,
      TEST_RPC_URL: effectiveRpc,
      VITE_TEST_RPC_URL: effectiveRpc,
      VITE_BASE_RPC_URL: effectiveRpc,
      TENDERLY_ADMIN_RPC_URL: backend.adminRpcUrl,
      E2E_TOKEN_SOURCE: backend.scenario.leverageTokenSource,
      E2E_LEVERAGE_TOKEN_KEY: backend.scenario.defaultLeverageTokenKey,
      ...(backend.contractOverrides
        ? { VITE_CONTRACT_ADDRESS_OVERRIDES: JSON.stringify(backend.contractOverrides) }
        : {}),
    }

    const overrideForChain = backend.contractOverrides?.[backend.canonicalChainId]
    const canonicalAddresses = getContractAddresses(backend.canonicalChainId)
    const executorAddress =
      (overrideForChain?.multicall as string | undefined) ??
      (canonicalAddresses.multicall as string | undefined)
    if (executorAddress && !envSeed['VITE_MULTICALL_EXECUTOR_ADDRESS']) {
      envSeed['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executorAddress
    }

    const env = withTestDefaults(
      testType,
      envSeed,
      backend.executionKind === 'anvil' ? 'anvil' : 'tenderly',
    )

    try {
      const { cmd, args } = getTestCommand(testType, passThroughArgs)
      await runCommand(cmd, args, env)
      console.log(`=== ✅ ${label} ===`)
    } catch (error) {
      console.error(`=== ❌ ${label} failed ===`)
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

  if (isChainAwareSuite && !env['VITE_INCLUDE_TEST_TOKENS']) {
    const currentRpc = env['TEST_RPC_URL']
    if (backend === 'tenderly' || currentRpc?.includes('tenderly')) {
      env['VITE_INCLUDE_TEST_TOKENS'] = 'true'
    }
  }

  if (!env['VITE_ETHEREUM_RPC_URL']) {
    const mainnetFallback =
      env['VITE_MAINNET_RPC_URL'] || env['TEST_RPC_URL'] || env['VITE_BASE_RPC_URL']
    if (mainnetFallback) {
      env['VITE_ETHEREUM_RPC_URL'] = mainnetFallback
    } else {
      env['VITE_ETHEREUM_RPC_URL'] = 'https://eth.llamarpc.com'
    }
  }

  if (isUiSuite && !env['E2E_TOKEN_SOURCE']) {
    const currentRpc = env['TEST_RPC_URL']
    if (backend === 'tenderly') env['E2E_TOKEN_SOURCE'] = 'tenderly'
    else if (backend === 'anvil') env['E2E_TOKEN_SOURCE'] = 'prod'
    else if (currentRpc?.includes('tenderly')) env['E2E_TOKEN_SOURCE'] = 'tenderly'
    else env['E2E_TOKEN_SOURCE'] = 'prod'
  }

  return env
}
