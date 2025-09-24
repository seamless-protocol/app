import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { base } from 'wagmi/chains'

describe('getContractAddresses', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/lib/contracts/addresses')
    vi.unmock('@/lib/contracts/overrides')
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_USE_TENDERLY_VNET', 'false')
    delete process.env['VITE_CONTRACT_ADDRESS_OVERRIDES']
  })

  afterEach(() => {
    vi.resetModules()
    vi.unmock('@/lib/contracts/addresses')
    vi.unmock('@/lib/contracts/overrides')
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_USE_TENDERLY_VNET', 'false')
    delete process.env['VITE_CONTRACT_ADDRESS_OVERRIDES']
  })

  it('returns canonical Base addresses when no override is provided', async () => {
    const addressesModule = await import('@/lib/contracts/addresses')
    addressesModule.setContractAddressOverridesForTesting({})

    const canonical = addressesModule.contractAddresses[base.id]?.leverageManagerV2

    expect(addressesModule.getContractAddresses(base.id).leverageManagerV2).toBe(canonical)
  })

  it('merges overrides when override map is provided', async () => {
    const overrideAddress = '0x1111111111111111111111111111111111111111'
    const addressesModule = await import('@/lib/contracts/addresses')
    addressesModule.setContractAddressOverridesForTesting({
      [base.id]: { leverageManagerV2: overrideAddress },
    })

    expect(addressesModule.getContractAddressOverrides()[base.id]?.leverageManagerV2).toBe(
      overrideAddress,
    )

    expect(addressesModule.getContractAddresses(base.id).leverageManagerV2).toBe(overrideAddress)
  })
})
