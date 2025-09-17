import type { ContractAddresses } from './addresses'

export type ContractAddressOverrides = Record<number, Partial<ContractAddresses>>

let cachedOverrides: ContractAddressOverrides | null = null

function readOverrideEnv(): string | undefined {
  try {
    if (typeof import.meta !== 'undefined') {
      const envValue = import.meta.env['VITE_CONTRACT_ADDRESS_OVERRIDES']
      if (envValue) return envValue
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

  const raw = readOverrideEnv()
  if (!raw) {
    cachedOverrides = {}
    return cachedOverrides
  }

  cachedOverrides = parseOverrides(raw)
  return cachedOverrides
}

export function setContractAddressOverridesForTesting(
  overrides: ContractAddressOverrides | null,
): void {
  cachedOverrides = overrides
}

export function resetContractAddressOverridesForTesting(): void {
  cachedOverrides = null
}
