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
type ScenarioKey = 'leverage-mint' | 'leverage-redeem'

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
  const token = process.env['TENDERLY_TOKEN']

  // Derive chainId from TEST_CHAIN or use explicit TENDERLY_CHAIN_ID
  const testChain = process.env['TEST_CHAIN']
  let chainId = process.env['TENDERLY_CHAIN_ID']

  if (!chainId && testChain) {
    // Map TEST_CHAIN to chain ID
    const chainMap: Record<string, string> = {
      base: '8453',
      mainnet: '1',
      ethereum: '1',
    }
    chainId = chainMap[testChain.toLowerCase()] || '8453'
  }

  chainId = chainId || '8453' // Default to Base

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

    case 'integration': {
      // If explicit test files are provided, run only those instead of the entire directory. // Call Vitest directly to avoid script recursion when test:integration itself uses this runner
      // Strip standalone '--' which is sometimes used by callers to separate args
      const cleaned = extraArgs.filter((a) => a !== '--')
      const hasExplicitTests = cleaned.some((a) => /tests\//.test(a) || /\.spec\.ts$/.test(a))
      const baseArgs = ['vitest', '-c', 'vitest.integration.config.ts', '--run']
      const args = hasExplicitTests
        ? [...baseArgs, ...cleaned]
        : [...baseArgs, 'tests/integration', ...cleaned]
      return { cmd: 'bunx', args }
    }
    default:
      throw new Error(`Unknown test type: ${testType}`)
  }
}

type BackendOption = 'tenderly' | 'anvil' | 'auto'

function parseArguments(): {
  testType: TestType
  chainOption?: string
  scenarioOption?: ScenarioKey
  backendOption?: BackendOption
  passThroughArgs: Array<string>
} {
  const args = process.argv.slice(2)
  const rawType = args.shift() as TestType | undefined
  if (!rawType || !['e2e', 'integration'].includes(rawType)) {
    console.error(
      'Usage: bun scripts/run-tests.ts [e2e|integration] [--chain <base|mainnet|all>] [--scenario <leverage-mint|leverage-redeem>] [--backend <tenderly|anvil|auto>] [extra args...]',
    )
    process.exit(1)
  }

  let chainOption: string | undefined
  let scenarioOption: ScenarioKey | undefined
  let backendOption: BackendOption | undefined
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
    } else if (arg === '--scenario') {
      const value = args.shift()
      if (!value) {
        console.error('Missing value after --scenario')
        process.exit(1)
      }
      if (value !== 'leverage-mint' && value !== 'leverage-redeem') {
        console.error(`Unsupported scenario '${value}'. Use 'leverage-mint' or 'leverage-redeem'.`)
        process.exit(1)
      }
      scenarioOption = value as ScenarioKey
    } else if (arg.startsWith('--scenario=')) {
      const value = arg.split('=')[1]
      if (value !== 'leverage-mint' && value !== 'leverage-redeem') {
        console.error(`Unsupported scenario '${value}'. Use 'leverage-mint' or 'leverage-redeem'.`)
        process.exit(1)
      }
      scenarioOption = value as ScenarioKey
    } else if (arg === '--backend') {
      const value = args.shift()
      if (!value) {
        console.error('Missing value after --backend')
        process.exit(1)
      }
      if (value !== 'tenderly' && value !== 'anvil' && value !== 'auto') {
        console.error(`Unsupported backend '${value}'. Use 'tenderly', 'anvil', or 'auto'.`)
        process.exit(1)
      }
      backendOption = value as BackendOption
    } else if (arg.startsWith('--backend=')) {
      const value = arg.split('=')[1]
      if (value !== 'tenderly' && value !== 'anvil' && value !== 'auto') {
        console.error(`Unsupported backend '${value}'. Use 'tenderly', 'anvil', or 'auto'.`)
        process.exit(1)
      }
      backendOption = value as BackendOption
    } else {
      passThroughArgs.push(arg)
    }
  }

  return {
    testType: rawType,
    ...(chainOption ? { chainOption } : {}),
    ...(scenarioOption ? { scenarioOption } : {}),
    ...(backendOption ? { backendOption } : {}),
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
  const { testType, chainOption, scenarioOption, backendOption, passThroughArgs } = parseArguments()

  if (chainOption) {
    await runForChainOption(chainOption, testType, passThroughArgs, scenarioOption, backendOption)
    return
  }

  // Check for explicit TEST_RPC_URL override
  const explicitRpcUrl = process.env['TEST_RPC_URL']
  if (explicitRpcUrl) {
    console.log(`🔗 Using explicit RPC URL: ${explicitRpcUrl}`)
    const { cmd, args } = getTestCommand(testType, passThroughArgs)
    const env = withTestDefaults(
      testType,
      {
        ...process.env,
        TEST_RPC_URL: explicitRpcUrl,
        ...(scenarioOption ? { TEST_SCENARIO: scenarioOption } : {}),
      } as Record<string, string>,
      'custom',
    )
    await runCommand(cmd, args, env)
    return
  }

  // Handle explicit backend selection
  if (backendOption === 'anvil') {
    console.log("🔨 Using Anvil backend (make sure it's running on port 8545)")
    const { cmd, args } = getTestCommand(testType, passThroughArgs)
    const env = withTestDefaults(
      testType,
      {
        ...process.env,
        TEST_RPC_URL: 'http://127.0.0.1:8545',
        TEST_MODE: 'anvil',
        ...(scenarioOption ? { TEST_SCENARIO: scenarioOption } : {}),
      } as Record<string, string>,
      'anvil',
    )
    await runCommand(cmd, args, env)
    return
  }

  // Try to get Tenderly config
  const tenderlyConfig = getTenderlyConfig()

  if (backendOption === 'tenderly') {
    if (!tenderlyConfig) {
      console.error('❌ Tenderly backend requested but configuration is missing.')
      console.error(
        '   Set TENDERLY_ACCOUNT, TENDERLY_PROJECT, and TENDERLY_ACCESS_KEY environment variables.',
      )
      process.exit(1)
    }
  }

  if (!tenderlyConfig) {
    console.log(
      "⚠️  No Tenderly configuration found. Falling back to Anvil (make sure it's running on port 8545)",
    )
    const { cmd, args } = getTestCommand(testType, passThroughArgs)
    const env = withTestDefaults(
      testType,
      {
        ...process.env,
        TEST_RPC_URL: 'http://127.0.0.1:8545',
        TEST_MODE: 'anvil',
        ...(scenarioOption ? { TEST_SCENARIO: scenarioOption } : {}),
      } as Record<string, string>,
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
    const env = withTestDefaults(
      testType,
      {
        ...process.env,
        TEST_RPC_URL: rpcUrl,
        ...(scenarioOption ? { TEST_SCENARIO: scenarioOption } : {}),
      } as Record<string, string>,
      'tenderly',
    )
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
  scenarioOption?: ScenarioKey,
  backendOption?: BackendOption,
) {
  const slugs: Array<ChainSlug> =
    chainOption === 'all'
      ? (['base', 'mainnet'] as Array<ChainSlug>)
      : ([chainOption] as Array<ChainSlug>)

  for (const slug of slugs) {
    const tenderlyCfg = getTenderlyConfig()
    const shouldUseTenderly = backendOption !== 'anvil' && tenderlyCfg

    if (backendOption === 'tenderly' && !tenderlyCfg) {
      console.error(`❌ Tenderly backend requested for ${slug} but configuration is missing.`)
      console.error(
        '   Set TENDERLY_ACCOUNT, TENDERLY_PROJECT, and TENDERLY_ACCESS_KEY environment variables.',
      )
      process.exit(1)
    }

    if (shouldUseTenderly && tenderlyCfg) {
      const chainMap: Record<ChainSlug, string> = { base: '8453', mainnet: '1' }
      const vnetCfg = { ...tenderlyCfg, chainId: chainMap[slug] }
      console.log(`\n⏳ Creating Tenderly JIT VNet for ${slug}...`)
      const { id, rpcUrl } = await createVNet(vnetCfg)
      console.log(`✅ VNet created: ${id}`)
      const label = `Run (${slug}, tenderly-jit)`

      try {
        const envSeed: Record<string, string> = {
          ...Object.fromEntries(
            Object.entries(process.env).filter(([_, value]) => value !== undefined),
          ),
          TEST_CHAIN: slug,
          TEST_MODE: 'tenderly-jit',
          TEST_SCENARIO: (scenarioOption ?? 'leverage-mint') as string,
          TEST_RPC_URL: rpcUrl,
          VITE_TEST_RPC_URL: rpcUrl,
          VITE_BASE_RPC_URL: rpcUrl,
          TENDERLY_ADMIN_RPC_URL: rpcUrl,
          E2E_CHAIN_ID: vnetCfg.chainId,
        }
        const env = withTestDefaults(testType, envSeed, 'tenderly')
        const focusArgs = scenarioOption ? selectE2ESpecsArgs(testType, slug, scenarioOption) : []
        const { cmd, args } = getTestCommand(testType, [...passThroughArgs, ...focusArgs])
        console.log(`=== 🚀 Running ${testType} tests [${label}] ===`)
        await runCommand(cmd, args, env)
        console.log(`=== ✅ ${label} ===`)
      } catch (error) {
        console.error(`=== ❌ ${label} failed ===`)
        throw error
      } finally {
        console.log('🧹 Deleting Tenderly VNet...')
        await deleteVNet({ ...vnetCfg, id })
        console.log('✅ VNet deleted')
      }
    } else {
      const backend = await resolveBackend({
        chain: slug,
        mode: backendOption === 'anvil' ? 'anvil' : 'tenderly-static',
        scenario: scenarioOption ?? 'leverage-mint',
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
        ...Object.fromEntries(
          Object.entries(process.env).filter(([_, value]) => value !== undefined),
        ),
        TEST_CHAIN: backend.chainKey,
        TEST_MODE: backend.mode,
        TEST_SCENARIO: backend.scenario.key,
        TEST_RPC_URL: effectiveRpc,
        VITE_TEST_RPC_URL: effectiveRpc,
        VITE_BASE_RPC_URL: effectiveRpc,
        TENDERLY_ADMIN_RPC_URL: backend.adminRpcUrl,
        E2E_TOKEN_SOURCE: process.env['E2E_TOKEN_SOURCE'] ?? backend.scenario.leverageTokenSource,
        E2E_LEVERAGE_TOKEN_KEY:
          process.env['E2E_LEVERAGE_TOKEN_KEY'] ?? backend.scenario.defaultLeverageTokenKey,
        ...(backend.contractOverrides
          ? { VITE_CONTRACT_ADDRESS_OVERRIDES: JSON.stringify(backend.contractOverrides) }
          : {}),
      }

      const overrideForChain = backend.contractOverrides?.[backend.canonicalChainId]
      const canonicalAddresses = getContractAddresses(backend.canonicalChainId)
      const executorAddress =
        (overrideForChain?.multicallExecutor as string | undefined) ??
        (canonicalAddresses.multicallExecutor as string | undefined)
      if (executorAddress && !envSeed['VITE_MULTICALL_EXECUTOR_ADDRESS']) {
        envSeed['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executorAddress
      }

      const env = withTestDefaults(
        testType,
        envSeed,
        backend.executionKind === 'anvil' ? 'anvil' : 'tenderly',
      )

      try {
        const focusArgs = scenarioOption ? selectE2ESpecsArgs(testType, slug, scenarioOption) : []
        const { cmd, args } = getTestCommand(testType, [...passThroughArgs, ...focusArgs])
        await runCommand(cmd, args, env)
        console.log(`=== ✅ ${label} ===`)
      } catch (error) {
        console.error(`=== ❌ ${label} failed ===`)
        throw error
      }
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

  // Enable mock wallet for E2E tests
  if (isUiSuite && !env['VITE_TEST_MODE']) {
    env['VITE_TEST_MODE'] = 'mock'
    env['VITE_E2E'] = '1'
  }

  // Auto-set VITE_INCLUDE_TEST_TOKENS for chain-aware suites if not explicitly set
  if (isChainAwareSuite && !env['VITE_INCLUDE_TEST_TOKENS']) {
    env['VITE_INCLUDE_TEST_TOKENS'] = 'true'
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

  // Auto-set E2E_TOKEN_SOURCE based on backend if not explicitly set
  if (isUiSuite && !env['E2E_TOKEN_SOURCE']) {
    env['E2E_TOKEN_SOURCE'] = backend === 'tenderly' ? 'tenderly' : 'prod'
  }

  // Default: disable LiFi live smoke specs in integration unless explicitly enabled
  // These tests hit the public LiFi API and can be flaky; keep them opt-in for CI stability.
  if (testType === 'integration') {
    const enableLive = env['ENABLE_LIFI_LIVE'] === '1'
    if (!enableLive) env['LIFI_LIVE'] = '0'
  }

  return env
}

function selectE2ESpecsArgs(
  testType: TestType,
  chain: ChainSlug,
  scenario: ScenarioKey,
): Array<string> {
  if (testType !== 'e2e') return []
  // Narrow the Playwright run to targeted specs when we know the intent.
  if (chain === 'mainnet') {
    if (scenario === 'leverage-mint') return ['tests/e2e/mainnet-wsteth-mint.spec.ts']
    if (scenario === 'leverage-redeem') return ['tests/e2e/mainnet-wsteth-redeem.spec.ts']
  }
  if (chain === 'base') {
    if (scenario === 'leverage-mint') return ['tests/e2e/leverage-token-mint.spec.ts']
    if (scenario === 'leverage-redeem') return ['tests/e2e/leverage-token-redeem.spec.ts']
  }
  return []
}
