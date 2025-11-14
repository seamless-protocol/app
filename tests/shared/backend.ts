import type { Chain } from 'viem'
import { anvil, base, mainnet } from 'viem/chains'
import type { ContractAddresses } from '../../src/lib/contracts/addresses'
import {
  BASE_TENDERLY_VNET_ADMIN_RPC,
  BASE_TENDERLY_VNET_PRIMARY_RPC,
  MAINNET_TENDERLY_VNET_ADMIN_RPC,
  MAINNET_TENDERLY_VNET_PRIMARY_RPC,
  TENDERLY_VNET_CONTRACT_OVERRIDES,
} from '../fixtures/addresses'
import {
  type ChainKey,
  defaultScenarioKey,
  listScenarioKeys,
  resolveScenario,
  type ScenarioDefinition,
  type ScenarioKey,
} from './scenarios'

export type BackendMode = 'tenderly-static' | 'tenderly-jit' | 'anvil'

export interface ResolveBackendOptions {
  chain?: ChainKey
  mode?: BackendMode
  scenario?: ScenarioKey
}

export interface ResolvedBackend {
  chainKey: ChainKey
  chainId: number
  canonicalChainId: number
  rpcUrl: string
  adminRpcUrl: string
  mode: BackendMode
  executionKind: 'tenderly' | 'anvil'
  scenario: ScenarioDefinition
  chain: Chain
  contractOverrides?: Record<number, Partial<ContractAddresses>>
}

const STATIC_ENDPOINTS: Record<
  ChainKey,
  { rpcUrl: string; adminRpcUrl: string; expectedChainId: number }
> = {
  base: {
    rpcUrl: BASE_TENDERLY_VNET_PRIMARY_RPC,
    adminRpcUrl: BASE_TENDERLY_VNET_ADMIN_RPC,
    expectedChainId: base.id,
  },
  mainnet: {
    rpcUrl: MAINNET_TENDERLY_VNET_PRIMARY_RPC,
    adminRpcUrl: MAINNET_TENDERLY_VNET_ADMIN_RPC,
    expectedChainId: mainnet.id,
  },
}

const DEFAULT_CHAIN: ChainKey = 'base'
// Default to Anvil for tests (fast, no API quotas); Tenderly available via --backend=tenderly
const DEFAULT_MODE: BackendMode = 'anvil'
const DEFAULT_ANVIL_RPC_URL = anvil.rpcUrls.default.http[0]

const CHAIN_ALIAS_MAP: Record<string, ChainKey> = {
  base: 'base',
  [String(base.id)]: 'base',
  mainnet: 'mainnet',
  ethereum: 'mainnet',
  [String(mainnet.id)]: 'mainnet',
}

const MODE_ALIAS_MAP: Record<string, BackendMode> = {
  static: 'tenderly-static',
  'tenderly-static': 'tenderly-static',
  jit: 'tenderly-jit',
  'tenderly-jit': 'tenderly-jit',
  tenderly: 'tenderly-jit',
  anvil: 'anvil',
  local: 'anvil',
}

export async function resolveBackend(
  options: ResolveBackendOptions = {},
): Promise<ResolvedBackend> {
  return resolveBackendInternal(options, true)
}

async function resolveBackendInternal(
  options: ResolveBackendOptions,
  allowFallback: boolean,
): Promise<ResolvedBackend> {
  const chainKey = options.chain ?? parseChain(process.env['TEST_CHAIN']) ?? DEFAULT_CHAIN
  const mode = options.mode ?? parseMode(process.env['TEST_MODE']) ?? DEFAULT_MODE
  const scenarioKey = options.scenario ?? parseScenario(chainKey, process.env['TEST_SCENARIO'])
  const scenario = resolveScenario(chainKey, scenarioKey)

  switch (mode) {
    case 'tenderly-static':
      return resolveStaticBackend({ chainKey, scenario }, allowFallback, options)
    case 'tenderly-jit':
      return resolveJitBackend({ chainKey, scenario })
    case 'anvil':
      return resolveAnvilBackend({ chainKey, scenario })
    default:
      throw new Error(`Unsupported backend mode '${mode}'`)
  }
}

type StaticBackendContext = { chainKey: ChainKey; scenario: ScenarioDefinition }

type JitBackendContext = StaticBackendContext

type AnvilBackendContext = StaticBackendContext

async function resolveStaticBackend(
  ctx: StaticBackendContext,
  allowFallback: boolean,
  options: ResolveBackendOptions,
): Promise<ResolvedBackend> {
  const staticConfig = STATIC_ENDPOINTS[ctx.chainKey]
  const rpcUrl = staticConfig.rpcUrl
  const adminRpcUrl = staticConfig.adminRpcUrl

  try {
    const chainId = await detectChainId(rpcUrl, true)
    if (chainId !== staticConfig.expectedChainId) {
      throw new Error(
        `Static Tenderly RPC returned chain ${chainId}, expected ${staticConfig.expectedChainId}`,
      )
    }
    return buildResolvedBackend({
      chainKey: ctx.chainKey,
      scenario: ctx.scenario,
      rpcUrl,
      adminRpcUrl,
      chainId,
      mode: 'tenderly-static',
      executionKind: 'tenderly',
      contractOverrides: TENDERLY_VNET_CONTRACT_OVERRIDES,
    })
  } catch (error) {
    if (allowFallback) {
      const jitCandidate = getJitRpcCandidate()
      if (jitCandidate) {
        console.warn(
          '[resolveBackend] Static Tenderly RPC unavailable, falling back to JIT fork',
          composeErrorDetails(error),
        )
        return resolveBackendInternal({ ...options, mode: 'tenderly-jit' }, false)
      }
    }
    throw new Error(
      `Failed to connect to static Tenderly RPC at ${rpcUrl}: ${composeErrorDetails(error)}`,
    )
  }
}

async function resolveJitBackend(ctx: JitBackendContext): Promise<ResolvedBackend> {
  const jit = getJitRpcCandidate()
  if (!jit?.rpcUrl) {
    throw new Error(
      'JIT backend requested but no Tenderly RPC URL found. Set TENDERLY_RPC_URL or TEST_RPC_URL.',
    )
  }
  const rpcUrl = jit.rpcUrl
  const adminRpcUrl = jit.adminRpcUrl ?? rpcUrl
  const chainId = await detectChainId(rpcUrl, true)

  return buildResolvedBackend({
    chainKey: ctx.chainKey,
    scenario: ctx.scenario,
    rpcUrl,
    adminRpcUrl,
    chainId,
    mode: 'tenderly-jit',
    executionKind: 'tenderly',
    contractOverrides: TENDERLY_VNET_CONTRACT_OVERRIDES,
  })
}

async function resolveAnvilBackend(ctx: AnvilBackendContext): Promise<ResolvedBackend> {
  const rpcUrl = pickAnvilRpcUrl()
  const adminRpcUrl = rpcUrl
  const chainId = await detectChainId(rpcUrl, false)

  return buildResolvedBackend({
    chainKey: ctx.chainKey,
    scenario: ctx.scenario,
    rpcUrl,
    adminRpcUrl,
    chainId,
    mode: 'anvil',
    executionKind: 'anvil',
  })
}

type BuildBackendParams = {
  chainKey: ChainKey
  scenario: ScenarioDefinition
  rpcUrl: string
  adminRpcUrl: string
  chainId: number
  mode: BackendMode
  executionKind: 'tenderly' | 'anvil'
  contractOverrides?: Record<number, Partial<ContractAddresses>>
}

function buildResolvedBackend(params: BuildBackendParams): ResolvedBackend {
  const canonicalChain = params.chainKey === 'base' ? base : mainnet
  const canonicalChainId = canonicalChain.id
  const chainWithRpc: Chain = {
    ...canonicalChain,
    id: params.chainId,
    rpcUrls: {
      ...canonicalChain.rpcUrls,
      default: { http: [params.rpcUrl] },
      public: { http: [params.rpcUrl] },
    },
  }

  const result: ResolvedBackend = {
    chainKey: params.chainKey,
    chainId: params.chainId,
    canonicalChainId,
    rpcUrl: params.rpcUrl,
    adminRpcUrl: params.adminRpcUrl,
    mode: params.mode,
    executionKind: params.executionKind,
    scenario: params.scenario,
    chain: chainWithRpc,
  }

  if (params.contractOverrides) {
    result.contractOverrides = params.contractOverrides
  }

  return result
}

function parseChain(value: string | undefined): ChainKey | undefined {
  if (!value) return undefined
  return CHAIN_ALIAS_MAP[value.toLowerCase()]
}

function parseMode(value: string | undefined): BackendMode | undefined {
  if (!value) return undefined
  return MODE_ALIAS_MAP[value.toLowerCase()]
}

function parseScenario(chain: ChainKey, raw: string | undefined): ScenarioKey {
  if (!raw) {
    return defaultScenarioKey(chain)
  }
  const normalized = raw.toLowerCase()
  const allKeys = new Set(listScenarioKeys(chain))
  if (allKeys.has(normalized as ScenarioKey)) {
    return normalized as ScenarioKey
  }
  return defaultScenarioKey(chain)
}

function getJitRpcCandidate(): { rpcUrl?: string; adminRpcUrl?: string } | undefined {
  const rpcUrl = pickNonLocalRpc([
    process.env['TENDERLY_RPC_URL'],
    process.env['TEST_RPC_URL'],
    process.env['RPC_URL'],
  ])
  if (!rpcUrl) {
    return undefined
  }
  const adminRpcUrl = pickNonLocalRpc([
    process.env['TENDERLY_ADMIN_RPC_URL'],
    process.env['TENDERLY_VNET_ADMIN_RPC'],
  ])
  return adminRpcUrl ? { rpcUrl, adminRpcUrl } : { rpcUrl }
}

function pickAnvilRpcUrl(): string {
  const candidates = [
    process.env['TEST_RPC_URL'],
    process.env['ANVIL_RPC_URL'],
    DEFAULT_ANVIL_RPC_URL,
  ]
  for (const candidate of candidates) {
    if (candidate && isLocalRpc(candidate)) {
      return candidate
    }
  }
  return DEFAULT_ANVIL_RPC_URL
}

function pickNonLocalRpc(candidates: Array<string | undefined>): string | undefined {
  for (const candidate of candidates) {
    if (candidate && !isLocalRpc(candidate)) {
      return candidate
    }
  }
  return undefined
}

function isLocalRpc(value: string | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost'
  } catch {
    return /^(https?:\/\/)?(127\.0\.0\.1|localhost)/i.test(value)
  }
}

function buildTenderlyHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = process.env['TENDERLY_TOKEN']
  const accessKey = process.env['TENDERLY_ACCESS_KEY']
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else if (accessKey) {
    headers['X-Access-Key'] = accessKey
  }
  return headers
}

async function detectChainId(rpcUrl: string, tenderly: boolean): Promise<number> {
  const headers = tenderly ? buildTenderlyHeaders() : { 'Content-Type': 'application/json' }
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  const json = (await response.json()) as { result?: string }
  if (!json?.result || typeof json.result !== 'string') {
    throw new Error('Missing chain id in RPC response')
  }
  return Number(BigInt(json.result))
}

function composeErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
