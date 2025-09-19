import { type Address, type PublicClient, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateMint } from '@/domain/mint'
import { createLifiQuoteAdapter } from '@/domain/mint/adapters/lifi'
import { createUniswapV2QuoteAdapter } from '@/domain/mint/adapters/uniswapV2'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import {
  AVAILABLE_LEVERAGE_TOKENS,
  DEFAULT_CHAIN_ID,
  getAddressesForToken,
  mode,
  RPC,
} from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, topUpErc20, topUpNative } from '../../../shared/funding'
import { withFork } from '../../../shared/withFork'

const TOKENS_UNDER_TEST = AVAILABLE_LEVERAGE_TOKENS.filter(
  (token) => token.chainId === DEFAULT_CHAIN_ID,
)

describe('Leverage Router V2 Mint (Tenderly VNet)', () => {
  beforeAll(() => {
    if (mode !== 'tenderly') {
      console.warn('Skipping V2 mint integration: requires Tenderly VNet via TEST_RPC_URL')
    }
    if (TOKENS_UNDER_TEST.length === 0) {
      console.warn('No leverage tokens available for current backend; mint specs will be skipped')
    }
  })
  afterAll(() => {})

  if (TOKENS_UNDER_TEST.length === 0) {
    it.skip('no leverage tokens configured for this backend', () => {})
    return
  }

  for (const tokenDefinition of TOKENS_UNDER_TEST) {
    const testLabel = `${tokenDefinition.label} (${tokenDefinition.key})`

    it(`mints shares successfully for ${testLabel}`, async () =>
      withFork(async ({ account, publicClient, config }) => {
        if (mode !== 'tenderly') {
          console.error('Integration requires Tenderly VNet. Configure TEST_RPC_URL.', {
            mode,
            rpc: RPC.primary,
          })
          throw new Error('TEST_RPC_URL missing or invalid for Tenderly mode')
        }

        const addresses = getAddressesForToken(tokenDefinition.key)
        const executor = addresses.executor
        if (!executor) {
          throw new Error('Multicall executor address missing; update contract map for V2 harness')
        }

        const previousKey = process.env['E2E_LEVERAGE_TOKEN_KEY']
        process.env['E2E_LEVERAGE_TOKEN_KEY'] = tokenDefinition.key
        process.env['VITE_ROUTER_VERSION'] = 'v2'
        process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

        try {
          console.info('[STEP] Using public RPC', { url: RPC.primary, token: testLabel })

          const token: Address = addresses.leverageToken
          const manager: Address = (addresses.managerV2 ?? addresses.manager) as Address
          const router: Address = (addresses.routerV2 ?? addresses.router) as Address

          const tokenConfig = getLeverageTokenConfig(token)
          const chainId = tokenConfig?.chainId ?? tokenDefinition.chainId
          console.info('[STEP] Chain ID', { chainId, token: testLabel })

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
          console.info('[STEP] Token assets', { token: testLabel, collateralAsset, debtAsset })

          const decimals = await readErc20Decimals(config, collateralAsset)
          const equityInInputAsset = parseUnits('10', decimals)
          console.info('[STEP] Funding + approving collateral', {
            token: testLabel,
            collateralAsset,
            equityInInputAsset: equityInInputAsset.toString(),
          })
          await topUpNative(account.address, '1')
          await topUpErc20(collateralAsset, account.address, '25')
          await approveIfNeeded(collateralAsset, router, equityInInputAsset)

          const shouldUseLiFi =
            tokenDefinition.swap?.useLiFi ?? process.env['TEST_USE_LIFI'] === '1'
          const quoteDebtToCollateral = shouldUseLiFi
            ? (() => {
                console.info('[STEP] Creating LiFi quote adapter', {
                  token: testLabel,
                  chainId,
                  router,
                  fromAddress: executor,
                  allowBridges: 'none',
                })
                return createLifiQuoteAdapter({
                  chainId,
                  router,
                  fromAddress: executor,
                  allowBridges: 'none',
                })
              })()
            : (() => {
                const uniswapRouter =
                  tokenDefinition.swap?.uniswapV2Router ??
                  (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
                  ('0x4752ba5DBc23f44D87826276BF6Fd6b1c372ad24' as Address)
                console.info('[STEP] Creating Uniswap V2 quote adapter', {
                  token: testLabel,
                  chainId,
                  router,
                  uniswapRouter,
                })
                return createUniswapV2QuoteAdapter({
                  publicClient: publicClient as unknown as Pick<
                    PublicClient,
                    'readContract' | 'getBlock'
                  >,
                  router: uniswapRouter,
                  recipient: router,
                  wrappedNative: addresses.weth,
                })
              })()

          const sharesBefore = await readLeverageTokenBalanceOf(config, {
            address: token,
            args: [account.address as Address],
          })

          console.info('[STEP] Orchestrating V2 mint (simulate+write)', { token: testLabel })
          const res = await orchestrateMint({
            config,
            account: account.address as Address,
            token,
            inputAsset: collateralAsset,
            equityInInputAsset,
            slippageBps: 50,
            quoteDebtToCollateral,
            routerAddressV2: router,
            managerAddressV2: manager,
          })
          expect(res.routerVersion).toBe('v2')
          expect(/^0x[0-9a-fA-F]{64}$/.test(res.hash)).toBe(true)
          if (res.routerVersion === 'v2') {
            console.info('[PLAN]', {
              token: testLabel,
              minShares: res.plan.minShares.toString(),
              expectedShares: res.plan.expectedShares.toString(),
              expectedDebt: res.plan.expectedDebt.toString(),
              expectedTotalCollateral: res.plan.expectedTotalCollateral.toString(),
              calls: res.plan.calls.length,
            })
          }

          const receipt = await publicClient.waitForTransactionReceipt({ hash: res.hash })
          expect(receipt.status).toBe('success')

          const sharesAfter = await readLeverageTokenBalanceOf(config, {
            address: token,
            args: [account.address],
          })
          const mintedShares = sharesAfter - sharesBefore
          expect(mintedShares > 0n).toBe(true)
          if (res.routerVersion === 'v2') {
            expect(mintedShares >= res.plan.minShares).toBe(true)
            expect(mintedShares).toBe(res.plan.expectedShares)
          }
        } finally {
          process.env['E2E_LEVERAGE_TOKEN_KEY'] = previousKey
        }
      }))
  }
})
