import { type Address, type PublicClient, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateRedeem, planRedeemV2 } from '@/domain/redeem'
import { createUniswapV4QuoteAdapter, type UniswapV4QuoteOptions } from '@/domain/shared/adapters/uniswapV4'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, V4, mode, RPC } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, erc20Abi, topUpErc20, topUpNative } from '../../../shared/funding'
import { type WithForkCtx, withFork } from '../../../shared/withFork'

describe('Leverage Router V2 Redeem (Tenderly VNet)', () => {
  beforeAll(() => {
    if (mode !== 'tenderly') {
      console.warn('Skipping V2 redeem integration: requires Tenderly VNet via TEST_RPC_URL')
    }
  })
  afterAll(() => {})

  const SLIPPAGE_BPS = 50

  it('redeems shares successfully (happy path)', async () =>
    withFork(async (ctx) => {
      ensureTenderlyMode()
      const scenario = await prepareRedeemScenario(ctx, SLIPPAGE_BPS)
      const mintOutcome = await executeMintPath(ctx, scenario)
      await executeRedeemPath(ctx, { ...scenario, ...mintOutcome })
    }))
})

type RedeemScenario = {
  token: Address
  manager: Address
  router: Address
  executor: Address
  chainId: number
  collateralAsset: Address
  debtAsset: Address
  equityInInputAsset: bigint
  slippageBps: number
  uniswapV4: {
    quoter: Address
    universalRouter: Address
    poolKey: {
      currency0: Address
      currency1: Address
      fee: number
      tickSpacing: number
      hooks: Address
    }
  }
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

async function prepareRedeemScenario(ctx: WithForkCtx, slippageBps: number): Promise<RedeemScenario> {
  const { config } = ctx

  process.env['VITE_ROUTER_VERSION'] = 'v2'
  const executor = ADDR.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }
  process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

  const quoterV4 = ADDR.quoterV4
  const universalRouterV4 = ADDR.universalRouterV4
  if (!quoterV4 || !universalRouterV4) {
    throw new Error('Uniswap v4 addresses missing; ensure V4_QUOTER and V4_UNIVERSAL_ROUTER are set')
  }

  const poolFee = V4.poolFee
  const tickSpacing = V4.tickSpacing
  if (typeof poolFee !== 'number' || typeof tickSpacing !== 'number') {
    throw new Error('Uniswap v4 pool config missing; set V4_POOL_FEE and V4_POOL_TICK_SPACING')
  }

  const token: Address = ADDR.leverageToken
  const manager: Address = (ADDR.managerV2 ?? ADDR.manager) as Address
  const router: Address = (ADDR.routerV2 ?? ADDR.router) as Address

  const tokenConfig = getLeverageTokenConfig(token)
  if (!tokenConfig) {
    throw new Error(`Leverage token config not found for ${token}`)
  }

  console.info('[STEP] Using public RPC', { url: RPC.primary })
  const chainId = tokenConfig.chainId
  console.info('[STEP] Chain ID', { chainId })

  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    address: manager,
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    address: manager,
    args: [token],
  })
  console.info('[STEP] Token assets', { collateralAsset, debtAsset })

  const decimals = await readErc20Decimals(config, collateralAsset)
  const equityInInputAsset = parseUnits('10', decimals)

  return {
    token,
    manager,
    router,
    executor,
    chainId,
    collateralAsset,
    debtAsset,
    equityInInputAsset,
    slippageBps,
    uniswapV4: {
      quoter: quoterV4,
      universalRouter: universalRouterV4,
      poolKey: {
        currency0: collateralAsset,
        currency1: debtAsset,
        fee: poolFee,
        tickSpacing,
        hooks: ADDR.v4Hooks ?? ZERO_ADDRESS,
      },
    },
  }
}

async function executeMintPath(ctx: WithForkCtx, scenario: RedeemScenario) {
  const { account, config, publicClient } = ctx
  const { token, router, collateralAsset, equityInInputAsset, slippageBps, manager, uniswapV4 } =
    scenario

  console.info('[STEP] Funding + approving collateral for mint', {
    collateralAsset,
    equityInInputAsset: equityInInputAsset.toString(),
  })
  await topUpNative(account.address, '1')
  await topUpErc20(collateralAsset, account.address, '25')
  await approveIfNeeded(collateralAsset, router, equityInInputAsset)

  const mintQuote = createUniswapV4QuoteAdapter({
    publicClient: publicClient as unknown as UniswapV4QuoteOptions['publicClient'],
    quoter: uniswapV4.quoter,
    universalRouter: uniswapV4.universalRouter,
    poolKey: uniswapV4.poolKey,
  })

  console.info('[STEP] Minting leverage tokens via V2 router')
  const { orchestrateMint } = await import('@/domain/mint')
  const mintTx = await orchestrateMint({
    config,
    account: account.address,
    token,
    inputAsset: collateralAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral: mintQuote,
    routerAddressV2: router,
    managerAddressV2: manager,
  })

  const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintTx.hash })
  expect(mintReceipt.status).toBe('success')

  const sharesAfterMint = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account.address],
  })
  expect(sharesAfterMint > 0n).toBe(true)

  return { sharesAfterMint }
}

async function executeRedeemPath(
  ctx: WithForkCtx,
  scenario: RedeemScenario & { sharesAfterMint: bigint },
): Promise<void> {
  const { account, config, publicClient } = ctx
  const {
    token,
    router,
    executor,
    manager,
    chainId,
    collateralAsset,
    sharesAfterMint,
    slippageBps,
    uniswapV4,
  } = scenario

  const sharesToRedeem = sharesAfterMint / 2n
  await approveIfNeeded(token, router, sharesToRedeem)

  console.info('[STEP] Planning redeem with Uniswap v4 adapter', {
    sharesToRedeem: sharesToRedeem.toString(),
  })

  const quoteCollateralToDebt = createUniswapV4QuoteAdapter({
    publicClient: publicClient as unknown as UniswapV4QuoteOptions['publicClient'],
    quoter: uniswapV4.quoter,
    universalRouter: uniswapV4.universalRouter,
    poolKey: uniswapV4.poolKey,
  })

  const plan = await planRedeemV2({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    managerAddress: manager,
  })

  expect(plan.sharesToRedeem).toBe(sharesToRedeem)
  expect(plan.expectedDebt > 0n).toBe(true)
  expect(plan.calls.length).toBeGreaterThanOrEqual(2)
  const hasApprovalOrWithdraw = plan.calls.some((call) => {
    if (call.target.toLowerCase() !== collateralAsset.toLowerCase()) return false
    return (
      call.data.startsWith('0x095ea7b3') || // ERC20 approve
      call.data.startsWith('0x2e1a7d4d') // WETH withdraw when using native path
    )
  })
  expect(hasApprovalOrWithdraw).toBe(true)

  const universalRouterCall = plan.calls.find(
    (call) => call.target.toLowerCase() === uniswapV4.universalRouter.toLowerCase(),
  )
  expect(universalRouterCall).toBeDefined()

  const collateralBalanceBefore = (await publicClient.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })) as bigint

  const sharesBeforeRedeem = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account.address],
  })

  const redeemTx = await orchestrateRedeem({
    config,
    account: account.address,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    routerAddressV2: router,
    managerAddressV2: manager,
  })

  expect(redeemTx.routerVersion).toBe('v2')
  const redeemReceipt = await publicClient.waitForTransactionReceipt({ hash: redeemTx.hash })
  expect(redeemReceipt.status).toBe('success')

  const sharesAfterRedeem = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account.address],
  })
  expect(sharesAfterRedeem).toBe(sharesBeforeRedeem - sharesToRedeem)

  const collateralBalanceAfter = (await publicClient.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })) as bigint

  const collateralDelta = collateralBalanceAfter - collateralBalanceBefore
  expect(collateralDelta >= plan.minCollateralForSender).toBe(true)
  expect(collateralDelta <= plan.expectedCollateral).toBe(true)

  // TODO: Assert debt balance drop via manager.previewRedeem once redeem succeeds end-to-end.
}

function ensureTenderlyMode(): void {
  if (mode === 'tenderly') return
  console.error('Integration requires Tenderly VNet. Configure TEST_RPC_URL.', {
    mode,
    rpc: RPC.primary,
  })
  throw new Error('TEST_RPC_URL missing or invalid for Tenderly mode')
}
