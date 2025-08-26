import { describe, it, expect } from 'vitest'
import { parseUnits } from 'viem'
import type { Address } from 'viem'
import { ENV } from '../../shared/env'
import { account, publicClient, walletClient } from '../../shared/clients'
import { withFork, } from '../../shared/withFork'
import { fundNative, fundWeETH } from '../../shared/funding'
import { mintWithRouter } from '../../../src/domain/mint-with-router'

describe('mintWithRouter (integration)', () => {
  it('mints via Router with weETH collateral', async () => withFork(async () => {
    // Ensure test account has native and weETH
    await fundNative(account.address, '5')
    await fundWeETH(account.address, '2') // 2 weETH

    const equity = parseUnits('1', 18)

    const result = await mintWithRouter(
      { publicClient, walletClient },
      { router: ENV.ADDR.ROUTER as Address, manager: ENV.ADDR.MANAGER as Address, token: ENV.ADDR.TOKEN as Address },
      account.address,
      { equityInCollateralAsset: equity }
    )

    expect(result.receipt.status).toBe('success')
    expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    expect(result.preview.shares).toBeGreaterThan(0n)
    expect(result.minShares).toBeGreaterThan(0n)
  }))
})

