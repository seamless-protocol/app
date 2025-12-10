import type { Chain } from 'viem'
import { anvil, base, mainnet } from 'viem/chains'
import type { ContractAddresses } from '../../src/lib/contracts/addresses'
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
  executionKind: 'anvil'
  scenario: ScenarioDefinition
  chain: Chain
  contractOverrides?: Record<number, Partial<ContractAddresses>>
}

const DEFAULT_CHAIN: ChainKey = 'base'
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
  anvil: 'anvil',
  local: 'anvil',
}

export async function resolveBackend(
  options: ResolveBackendOptions = {},
): Promise<ResolvedBackend> {
  return resolveBackendInternal(options)
}

async function resolveBackendInternal(options: ResolveBackendOptions): Promise<ResolvedBackend> {
  const chainKey = options.chain ?? parseChain(process.env['TEST_CHAIN']) ?? DEFAULT_CHAIN
  const mode = options.mode ?? parseMode(process.env['TEST_MODE']) ?? DEFAULT_MODE
  const scenarioKey = options.scenario ?? parseScenario(chainKey, process.env['TEST_SCENARIO'])
  const scenario = resolveScenario(chainKey, scenarioKey)

  switch (mode) {
    case 'anvil':
      return resolveAnvilBackend({ chainKey, scenario })
    default:
      throw new Error(`Unsupported backend mode '${mode}'`)
  }
}

type StaticBackendContext = { chainKey: ChainKey; scenario: ScenarioDefinition }

type AnvilBackendContext = StaticBackendContext

async function resolveAnvilBackend(ctx: AnvilBackendContext): Promise<ResolvedBackend> {
  const rpcUrl = pickAnvilRpcUrl()
  const adminRpcUrl = rpcUrl
  const chainId = await detectChainId(rpcUrl)

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
  executionKind: 'anvil'
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

function isLocalRpc(value: string | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.hostname === '127.0.0.1' || url.hostname === 'localhost'
  } catch {
    return /^(https?:\/\/)?(127\.0\.0\.1|localhost)/i.test(value)
  }
}

async function detectChainId(rpcUrl: string): Promise<number> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
