import { type Address, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateRedeem, planRedeemV2 } from '@/domain/redeem'
import {
  createUniswapV3QuoteAdapter,
  type UniswapV3QuoteOptions,
} from '@/domain/shared/adapters/uniswapV3'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, mode, RPC, V3 } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, erc20Abi } from '../../../shared/funding'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { type WithForkCtx, withFork } from '../../../shared/withFork'

describe('Leverage Router V2 Redeem (Tenderly VNet)', () => {
  beforeAll(() => {
    if (mode !== 'tenderly') {
      console.warn('Skipping V2 redeem integration: requires Tenderly VNet via TEST_RPC_URL')
    }
  })
  afterAll(() => {})

  const SLIPPAGE_BPS = 50

  it('redeems all minted shares via Uniswap v3 (happy path)', async () =>
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
  collateralAsset: Address
  debtAsset: Address
  equityInInputAsset: bigint
  slippageBps: number
  uniswapV3: {
    quoter: Address
    swapRouter: Address
    fee: number
    poolAddress: Address
    wrappedNative?: Address
  }
}

async function prepareRedeemScenario(
  ctx: WithForkCtx,
  slippageBps: number,
): Promise<RedeemScenario> {
  const { config } = ctx

  // Note: VITE_ROUTER_VERSION and VITE_MULTICALL_EXECUTOR_ADDRESS are set by executeSharedMint
  const executor = ADDR.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }

  const quoterV3 = ADDR.v3Quoter
  const swapRouterV3 = ADDR.v3SwapRouter
  if (!quoterV3 || !swapRouterV3) {
    throw new Error('Uniswap v3 addresses missing; set V3_QUOTER and V3_SWAP_ROUTER')
  }

  const poolFee = V3.poolFee
  if (typeof poolFee !== 'number') {
    throw new Error('Uniswap v3 pool config missing; set V3_POOL_FEE')
  }

  const poolAddress = ADDR.v3Pool
  if (!poolAddress) {
    throw new Error('Uniswap v3 pool address missing; set V3_POOL_ADDRESS or repo default')
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
    collateralAsset,
    debtAsset,
    equityInInputAsset,
    slippageBps,
    uniswapV3: {
      quoter: quoterV3,
      swapRouter: swapRouterV3,
      fee: poolFee,
      poolAddress,
      wrappedNative: ADDR.weth,
    },
  }
}

async function executeMintPath(ctx: WithForkCtx, scenario: RedeemScenario) {
  const { account, config, publicClient } = ctx
  
  // Use V2 for mint step to match redeem step
  process.env['VITE_ROUTER_VERSION'] = 'v2'
  const mintOutcome = await executeSharedMint({
    account,
    publicClient,
    config,
    slippageBps: scenario.slippageBps,
  })

  const sharesAfterMint = await readLeverageTokenBalanceOf(config, {
    address: mintOutcome.token,
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
  const { token, router, manager, collateralAsset, sharesAfterMint, slippageBps, uniswapV3 } =
    scenario

  const sharesToRedeem = sharesAfterMint
  await approveIfNeeded(token, router, sharesToRedeem)

  console.info('[STEP] Planning redeem with Uniswap v3 adapter', {
    sharesToRedeem: sharesToRedeem.toString(),
  })

  const quoteCollateralToDebt = createUniswapV3QuoteAdapter({
    publicClient: publicClient as unknown as UniswapV3QuoteOptions['publicClient'],
    quoter: uniswapV3.quoter,
    router: uniswapV3.swapRouter,
    fee: uniswapV3.fee,
    recipient: router,
    poolAddress: uniswapV3.poolAddress,
    ...(uniswapV3.wrappedNative ? { wrappedNative: uniswapV3.wrappedNative } : {}),
  })

  const plan = await planRedeemV2({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    managerAddress: manager,
  })

  console.info('[PLAN DEBUG]', {
    expectedDebt: plan.expectedDebt.toString(),
    expectedCollateral: plan.expectedCollateral.toString(),
    minCollateral: plan.minCollateralForSender.toString(),
    calls: plan.calls.map((call) => ({ target: call.target, value: call.value.toString() })),
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

  const swapRouterCall = plan.calls.find(
    (call) => call.target.toLowerCase() === uniswapV3.swapRouter.toLowerCase(),
  )
  expect(swapRouterCall).toBeDefined()

  // Debug: Log all swap calls to see what's being executed
  console.log('[DEBUG] Swap calls in redeem plan:')
  plan.calls.forEach((call, index) => {
    console.log(`[DEBUG] Call ${index}:`, {
      target: call.target,
      value: call.value,
      data: call.data.slice(0, 10), // First 4 bytes (function selector)
      dataLength: call.data.length
    })
  })

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
}

function ensureTenderlyMode(): void {
  if (mode === 'tenderly') return
  console.error('Integration requires Tenderly VNet. Configure TEST_RPC_URL.', {
    mode,
    rpc: RPC.primary,
  })
  throw new Error('TEST_RPC_URL missing or invalid for Tenderly mode')
}
