import type { Address } from 'viem'
import { getAddress } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
} from '@/lib/contracts/generated'
import { ADDR, mode } from '../../../shared/env'
import { seedUniswapV2PairLiquidity } from '../../../shared/funding'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { withFork } from '../../../shared/withFork'

describe('Leverage Router V2 Mint (Tenderly VNet)', () => {
  beforeAll(() => {
    if (mode !== 'tenderly') {
      console.warn('Skipping V2 mint integration: requires Tenderly VNet via TEST_RPC_URL')
    }
  })
  afterAll(() => {})

  it(
    'mints shares successfully (happy path)',
    async () =>
      withFork(async ({ account, publicClient, config }) => {
        if (mode !== 'tenderly') {
          throw new Error('TEST_RPC_URL missing or invalid for tenderly mode')
        }

        const previousAdapter = process.env['TEST_QUOTE_ADAPTER']
        process.env['TEST_QUOTE_ADAPTER'] = 'uniswapv2'
        try {
          const manager = getAddress((ADDR.managerV2 ?? ADDR.manager) as Address)
          const token = getAddress(ADDR.leverageToken)
          const uniswapRouter =
            (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
            ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)
          const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(
            config,
            {
              address: manager,
              args: [token],
            },
          )
          const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
            address: manager,
            args: [token],
          })

          await seedUniswapV2PairLiquidity({
            router: uniswapRouter,
            tokenA: collateralAsset,
            tokenB: debtAsset,
          })

          const outcome = await executeSharedMint({ account, publicClient, config })
          expect(outcome.sharesMinted > 0n).toBe(true)
          console.info('[SHARED MINT RESULT]', {
            token: outcome.token,
            sharesMinted: outcome.sharesMinted.toString(),
          })
        } finally {
          if (typeof previousAdapter === 'string') {
            process.env['TEST_QUOTE_ADAPTER'] = previousAdapter
          } else {
            delete process.env['TEST_QUOTE_ADAPTER']
          }
        }
      }),
    120_000,
  )
})
