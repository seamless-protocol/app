import { createLogger } from '@/lib/logger'
import type { ContractAddresses } from './addresses'

const logger = createLogger('contract-overrides')

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
    logger.warn('Unable to read VITE_CONTRACT_ADDRESS_OVERRIDES', { error })
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

  logger.info('Checking Tenderly VNet mode', { useTenderlyVNet })

  if (useTenderlyVNet === 'true') {
    logger.info('Using Tenderly VNet addresses')
    // Return Tenderly VNet contract address overrides
    return JSON.stringify({
      '1': {
        // Align VNet to canonical mainnet addresses
        leverageTokenFactory: '0x603Da735780e6bC7D04f3FB85C26dccCd4Ff0a82',
        leverageTokenImpl: '0xfE9101349354E278970489F935a54905DE2E1856',
        leverageManagerV2: '0x5C37EB148D4a261ACD101e2B997A0F163Fb3E351',
        leverageRouterV2: '0xb0764dE7eeF0aC69855C431334B7BC51A96E6DbA',
        // Periphery
        morphoLendingAdapterFactory: '0xce05FbEd9260810Bdded179ADfdaf737BE7ded71',
        morphoLendingAdapterImpl: '0x00c66934EBCa0F2A845812bC368B230F6da11A5C',
        veloraAdapter: '0xc4E5812976279cBcec943A6a148C95eAAC7Db6BA',
        pricingAdapter: '0x44CCEBEA0dAc17105e91a59E182f65f8D176c88f',
        rebalanceAdapter: '0x0a4490233Fd6Ea02873af11c744d286DC3d6C127',
        lendingAdapter: '0xB22cd280b29e581e34423E86F65fd259F456D335',
        multicall: '0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1',
        tokens: {
          usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          weeth: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
        },
      },
      '8453': {
        leverageManager: '0x959c574EC9A40b64245A3cF89b150Dc278e9E55C',
        leverageManagerV2: '0x959c574EC9A40b64245A3cF89b150Dc278e9E55C',
        leverageRouter: '0xfd46483b299197c616671B7dF295cA5186c805c2',
        leverageRouterV2: '0xfd46483b299197c616671B7dF295cA5186c805c2',
        multicall: '0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd',
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
    logger.warn('Failed to parse VITE_CONTRACT_ADDRESS_OVERRIDES', { error })
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
