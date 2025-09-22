import { type Address, type PublicClient, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateMint } from '@/domain/mint'
import { createLifiQuoteAdapter } from '@/domain/mint/adapters/lifi'
import { createUniswapV2QuoteAdapter } from '@/domain/mint/adapters/uniswapV2'
import {
  createUniswapV3QuoteAdapter,
  type UniswapV3QuoteOptions,
} from '@/domain/mint/adapters/uniswapV3'
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
import { type WithForkCtx, withFork } from '../../../shared/withFork'

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
      withFork(async (ctx) => {
        if (mode !== 'tenderly') {
          console.error('Integration requires Tenderly VNet. Configure TEST_RPC_URL.', {
            mode,
            rpc: RPC.primary,
          })
          throw new Error('TEST_RPC_URL missing or invalid for Tenderly mode')
        }

        await runMintScenario({ ctx, tokenDefinition, label: testLabel })
      }))
  }
})

type MintScenarioParams = {
  ctx: WithForkCtx
  tokenDefinition: (typeof AVAILABLE_LEVERAGE_TOKENS)[number]
  label: string
}

async function runMintScenario({ ctx, tokenDefinition, label }: MintScenarioParams): Promise<void> {
  const { account, publicClient, config } = ctx
  const { addresses, token, manager, router } = resolveTokenAddresses(tokenDefinition)

  const previousKey = process.env['E2E_LEVERAGE_TOKEN_KEY']
  process.env['E2E_LEVERAGE_TOKEN_KEY'] = tokenDefinition.key
  process.env['VITE_ROUTER_VERSION'] = 'v2'
  process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = addresses.executor as Address

  try {
    console.info('[STEP] Using public RPC', { url: RPC.primary, token: label })

    const { collateralAsset, equityInInputAsset } = await fetchTokenAssets({
      config,
      manager,
      token,
      label,
    })

    await fundAccount({
      account: account.address,
      collateralAsset,
      router,
      equityInInputAsset,
      label,
    })

    const quoteDebtToCollateral = buildQuoteAdapter({
      tokenDefinition,
      chainId: tokenDefinition.chainId,
      router,
      executor: addresses.executor as Address,
      publicClient,
      addresses,
      label,
    })

    const sharesBefore = await readLeverageTokenBalanceOf(config, {
      address: token,
      args: [account.address],
    })

    const orchestration = await orchestrateMint({
      config,
      account: account.address,
      token,
      inputAsset: collateralAsset,
      equityInInputAsset,
      slippageBps: 50,
      quoteDebtToCollateral,
      routerAddressV2: router,
      managerAddressV2: manager,
    })

    await assertMintOutcome({
      orchestration,
      publicClient,
      token,
      account: account.address,
      config,
      sharesBefore,
      label,
    })
  } finally {
    process.env['E2E_LEVERAGE_TOKEN_KEY'] = previousKey
  }
}

function resolveTokenAddresses(tokenDefinition: (typeof AVAILABLE_LEVERAGE_TOKENS)[number]) {
  const addresses = getAddressesForToken(tokenDefinition.key)
  const executor = addresses.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }

  const token = addresses.leverageToken
  const manager = (addresses.managerV2 ?? addresses.manager) as Address
  const router = (addresses.routerV2 ?? addresses.router) as Address

  return { addresses, token, manager, router }
}

async function fetchTokenAssets({
  config,
  manager,
  token,
  label,
}: {
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  manager: Address
  token: Address
  label: string
}) {
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    address: manager,
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    address: manager,
    args: [token],
  })
  console.info('[STEP] Token assets', { token: label, collateralAsset, debtAsset })

  const decimals = await readErc20Decimals(config, collateralAsset)
  const equityInInputAsset = parseUnits('10', decimals)

  return { collateralAsset, equityInInputAsset }
}

async function fundAccount({
  account,
  collateralAsset,
  router,
  equityInInputAsset,
  label,
}: {
  account: Address
  collateralAsset: Address
  router: Address
  equityInInputAsset: bigint
  label: string
}) {
  console.info('[STEP] Funding + approving collateral', {
    token: label,
    collateralAsset,
    equityInInputAsset: equityInInputAsset.toString(),
  })
  await topUpNative(account, '1')
  await topUpErc20(collateralAsset, account, '25')
  await approveIfNeeded(collateralAsset, router, equityInInputAsset)
}

function buildQuoteAdapter({
  tokenDefinition,
  chainId,
  router,
  executor,
  publicClient,
  addresses,
  label,
}: {
  tokenDefinition: (typeof AVAILABLE_LEVERAGE_TOKENS)[number]
  chainId: number
  router: Address
  executor: Address
  publicClient: PublicClient
  addresses: ReturnType<typeof getAddressesForToken>
  label: string
}) {
  const shouldUseLiFi = tokenDefinition.swap?.useLiFi ?? process.env['TEST_USE_LIFI'] === '1'
  if (shouldUseLiFi) {
    console.info('[STEP] Creating LiFi quote adapter', {
      token: label,
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
  }

  const shouldUseUniswapV3 = Boolean(tokenDefinition.swap?.uniswapV3)
  if (shouldUseUniswapV3) {
    const v3Addresses = addresses.uniswapV3
    if (!v3Addresses) {
      throw new Error('Uniswap V3 configuration missing for leverage token')
    }
    const { pool, fee, quoter, router: swapRouter } = v3Addresses
    if (!swapRouter) {
      throw new Error('Uniswap V3 swap router missing; update chain config')
    }
    console.info('[STEP] Creating Uniswap V3 quote adapter', {
      token: label,
      chainId,
      quoter,
      swapRouter,
      pool,
      fee,
    })
    return createUniswapV3QuoteAdapter({
      publicClient: publicClient as unknown as UniswapV3QuoteOptions['publicClient'],
      ...(quoter ? { quoter } : {}),
      router: swapRouter,
      fee,
      recipient: router,
      poolAddress: pool,
      wrappedNative: addresses.weth,
    })
  }

  const uniswapRouter =
    tokenDefinition.swap?.uniswapV2Router ??
    (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
    ('0x4752ba5DBc23f44D87826276BF6Fd6b1c372ad24' as Address)

  console.info('[STEP] Creating Uniswap V2 quote adapter', {
    token: label,
    chainId,
    router,
    uniswapRouter,
  })

  return createUniswapV2QuoteAdapter({
    publicClient: publicClient as unknown as Pick<PublicClient, 'readContract' | 'getBlock'>,
    router: uniswapRouter,
    recipient: router,
    wrappedNative: addresses.weth,
  })
}

async function assertMintOutcome({
  orchestration,
  publicClient,
  token,
  account,
  config,
  sharesBefore,
  label,
}: {
  orchestration: Awaited<ReturnType<typeof orchestrateMint>>
  publicClient: PublicClient
  token: Address
  account: Address
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  sharesBefore: bigint
  label: string
}) {
  expect(orchestration.routerVersion).toBe('v2')
  expect(/^0x[0-9a-fA-F]{64}$/.test(orchestration.hash)).toBe(true)

  if (orchestration.routerVersion === 'v2') {
    console.info('[PLAN]', {
      token: label,
      minShares: orchestration.plan.minShares.toString(),
      expectedShares: orchestration.plan.expectedShares.toString(),
      expectedDebt: orchestration.plan.expectedDebt.toString(),
      expectedTotalCollateral: orchestration.plan.expectedTotalCollateral.toString(),
      calls: orchestration.plan.calls.length,
    })
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash: orchestration.hash })
  expect(receipt.status).toBe('success')

  const sharesAfter = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account],
  })
  const mintedShares = sharesAfter - sharesBefore
  expect(mintedShares > 0n).toBe(true)

  if (orchestration.routerVersion === 'v2') {
    expect(mintedShares >= orchestration.plan.minShares).toBe(true)
    expect(mintedShares).toBe(orchestration.plan.expectedShares)
  }
}
