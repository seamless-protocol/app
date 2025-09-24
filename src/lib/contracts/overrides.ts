import type { ContractAddresses } from './addresses'

export type ContractAddressOverrides = Record<number, Partial<ContractAddresses>>

let cachedOverrides: ContractAddressOverrides | null = null

function readOverrideEnv(): string | undefined {
  try {
    if (typeof import.meta !== 'undefined') {
      const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      if (metaEnv) {
        const envValue = metaEnv['VITE_CONTRACT_ADDRESS_OVERRIDES']
        if (envValue) return envValue
      }
    }
  } catch (error) {
    console.warn('[contracts] Unable to read VITE_CONTRACT_ADDRESS_OVERRIDES', error)
  }

  const processEnvValue =
    typeof process !== 'undefined' ? process.env['VITE_CONTRACT_ADDRESS_OVERRIDES'] : undefined
  if (processEnvValue) {
    return processEnvValue
  }

  return undefined
}

function getTenderlyOverrides(): string | undefined {
  const useTenderlyVNet =
    (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_USE_TENDERLY_VNET']) ||
    (typeof process !== 'undefined' && process.env['VITE_USE_TENDERLY_VNET'])

  console.log(`🔍 [getTenderlyOverrides] VITE_USE_TENDERLY_VNET:`, useTenderlyVNet)

  if (useTenderlyVNet === 'true') {
    console.log(`✅ [getTenderlyOverrides] Using Tenderly VNet addresses`)
    // Return Tenderly VNet contract address overrides
    return JSON.stringify({
      '8453': {
        leverageManagerV2: '0x575572D9cF8692d5a8e8EE5312445D0A6856c55f',
        leverageRouterV2: '0x71E826cC335DaBac3dAF4703B2119983e1Bc843B',
        multicall: '0x8db50770F8346e7D98886410490E9101718869EB',
      },
    })
  }

  return undefined
}

function parseOverrides(rawOverrides: string): ContractAddressOverrides {
  try {
    const parsed = JSON.parse(rawOverrides) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    const result: ContractAddressOverrides = {}

    for (const [key, value] of Object.entries(parsed)) {
      const chainId = Number(key)
      if (!Number.isFinite(chainId) || !value || typeof value !== 'object') {
        continue
      }

      result[chainId] = value as Partial<ContractAddresses>
    }

    return result
  } catch (error) {
    console.warn('[contracts] Failed to parse VITE_CONTRACT_ADDRESS_OVERRIDES', error)
    return {}
  }
}

export function getContractAddressOverrides(): ContractAddressOverrides {
  if (cachedOverrides) return cachedOverrides

  // First check for explicit VITE_CONTRACT_ADDRESS_OVERRIDES
  const explicitOverrides = readOverrideEnv()
  if (explicitOverrides) {
    cachedOverrides = parseOverrides(explicitOverrides)
    return cachedOverrides
  }

  // Then check for Tenderly VNet mode
  const tenderlyOverrides = getTenderlyOverrides()
  if (tenderlyOverrides) {
    cachedOverrides = parseOverrides(tenderlyOverrides)
    return cachedOverrides
  }

  cachedOverrides = {}
  return cachedOverrides
}

export function setContractAddressOverridesForTesting(
  overrides: ContractAddressOverrides | null,
): void {
  cachedOverrides = overrides
}
