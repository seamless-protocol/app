import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { base } from 'wagmi/chains'

describe('getContractAddresses', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/lib/contracts/addresses')
    vi.unmock('@/lib/contracts/overrides')
    vi.unstubAllEnvs()
    delete process.env['VITE_CONTRACT_ADDRESS_OVERRIDES']
  })

  afterEach(() => {
    vi.resetModules()
    vi.unmock('@/lib/contracts/addresses')
    vi.unmock('@/lib/contracts/overrides')
    vi.unstubAllEnvs()
    delete process.env['VITE_CONTRACT_ADDRESS_OVERRIDES']
  })

  it('returns canonical Base addresses when no override is provided', async () => {
    const { contractAddresses, getContractAddresses } = await import('@/lib/contracts/addresses')

    const canonical = contractAddresses[base.id]?.leverageManager

    expect(getContractAddresses(base.id).leverageManager).toBe(canonical)
  })

  it('merges overrides when override map is provided', async () => {
    const overrideAddress = '0x1111111111111111111111111111111111111111'
    const addressesModule = await import('@/lib/contracts/addresses')
    addressesModule.setContractAddressOverridesForTesting({
      [base.id]: { leverageManager: overrideAddress },
    })

    expect(addressesModule.getContractAddressOverrides()[base.id]?.leverageManager).toBe(
      overrideAddress,
    )

    expect(addressesModule.getContractAddresses(base.id).leverageManager).toBe(overrideAddress)
  })
})
