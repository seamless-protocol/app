import type { LeverageTokenKey, LeverageTokenSource } from '../../fixtures/addresses'

export type ChainKey = 'base' | 'mainnet'
export type ScenarioKey = 'leverage-mint' | 'leverage-redeem'

export interface ScenarioDefinition {
  key: ScenarioKey
  label: string
  description?: string
  leverageTokenSource: LeverageTokenSource
  leverageTokenKeys: Array<LeverageTokenKey>
  defaultLeverageTokenKey: LeverageTokenKey
}

const baseScenarios: Record<ScenarioKey, ScenarioDefinition> = {
  'leverage-mint': {
    key: 'leverage-mint',
    label: 'Base leverage mint',
    description: 'Exercises leverage token mint flows on Base using prod leverage tokens.',
    leverageTokenSource: 'prod',
    leverageTokenKeys: ['weeth-weth-17x'],
    defaultLeverageTokenKey: 'weeth-weth-17x',
  },
  'leverage-redeem': {
    key: 'leverage-redeem',
    label: 'Base leverage redeem',
    description: 'Exercises leverage token redeem flows on Base.',
    leverageTokenSource: 'prod',
    leverageTokenKeys: ['weeth-weth-17x'],
    defaultLeverageTokenKey: 'weeth-weth-17x',
  },
}

const mainnetScenarios: Record<ScenarioKey, ScenarioDefinition> = {
  'leverage-mint': {
    key: 'leverage-mint',
    label: 'Mainnet leverage mint',
    description: 'Exercises leverage token mint flows on Mainnet using prod leverage tokens.',
    leverageTokenSource: 'prod',
    leverageTokenKeys: ['wsteth-eth-25x'],
    defaultLeverageTokenKey: 'wsteth-eth-25x',
  },
  'leverage-redeem': {
    key: 'leverage-redeem',
    label: 'Mainnet leverage redeem',
    description: 'Exercises leverage token redeem flows on Mainnet using prod leverage tokens.',
    leverageTokenSource: 'prod',
    leverageTokenKeys: ['wsteth-eth-25x'],
    defaultLeverageTokenKey: 'wsteth-eth-25x',
  },
}

const registry: Record<ChainKey, Record<ScenarioKey, ScenarioDefinition>> = {
  base: baseScenarios,
  mainnet: mainnetScenarios,
}

const DEFAULT_SCENARIO: Record<ChainKey, ScenarioKey> = {
  base: 'leverage-mint',
  mainnet: 'leverage-mint',
}

export function resolveScenario(chain: ChainKey, scenarioKey?: ScenarioKey): ScenarioDefinition {
  const key = scenarioKey ?? DEFAULT_SCENARIO[chain]
  const scenariosForChain = registry[chain]
  const scenario = scenariosForChain?.[key]
  if (!scenario) {
    throw new Error(`Scenario '${key}' is not configured for chain '${chain}'`)
  }
  return scenario
}

export function defaultScenarioKey(chain: ChainKey): ScenarioKey {
  return DEFAULT_SCENARIO[chain]
}

export function listScenarioKeys(chain: ChainKey): Array<ScenarioKey> {
  return Object.keys(registry[chain] ?? {}) as Array<ScenarioKey>
}
