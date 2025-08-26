import type { Address } from 'viem'
import { parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'
import { mintWithRouter } from '../../../src/domain/mint-with-router'
import { account, publicClient, walletClient } from '../../shared/clients'
import { ENV } from '../../shared/env'
import { fundNative, fundWeETH } from '../../shared/funding'
import { withFork } from '../../shared/withFork'

describe('mintWithRouter (integration)', () => {
  it('mints via Router with weETH collateral', async () =>
    withFork(async () => {
      // Ensure test account has native and weETH
      await fundNative(account.address, '5')
      await fundWeETH(account.address, '2') // 2 weETH

      const equity = parseUnits('1', 18)

      const result = await mintWithRouter(
        { publicClient, walletClient },
        {
          router: ENV.ADDR.ROUTER as Address,
          manager: ENV.ADDR.MANAGER as Address,
          token: ENV.ADDR.TOKEN as Address,
        },
        account.address,
        { equityInCollateralAsset: equity },
      )

      expect(result.receipt.status).toBe('success')
      expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(result.preview.shares).toBeGreaterThan(0n)
      expect(result.minShares).toBeGreaterThan(0n)
    }))
})
