import { type Address, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateRedeem, planRedeemV2 } from '@/domain/redeem'
import {
  type CollateralToDebtSwapConfig,
  createCollateralToDebtQuote,
} from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { ADDR, CHAIN_ID, mode, RPC } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, erc20Abi, seedUniswapV2PairLiquidity } from '../../../shared/funding'
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

  it(
    'redeems all minted shares via Uniswap v2 (happy path)',
    async () =>
      withFork(async (ctx) => {
        ensureTenderlyMode()
        const scenario = await prepareRedeemScenario(ctx, SLIPPAGE_BPS)
        const mintOutcome = await executeMintPath(ctx, scenario)
        await executeRedeemPath(ctx, { ...scenario, ...mintOutcome })
      }),
    120_000,
  )
})

type RedeemScenario = {
  token: Address
  manager: Address
  router: Address
  collateralAsset: Address
  debtAsset: Address
  equityInInputAsset: bigint
  slippageBps: number
  chainId: number
  swap: CollateralToDebtSwapConfig
}

async function prepareRedeemScenario(
  ctx: WithForkCtx,
  slippageBps: number,
): Promise<RedeemScenario> {
  const { config } = ctx

  process.env['VITE_ROUTER_VERSION'] = 'v2'
  const executor = ADDR.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }
  process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

  const uniswapRouter =
    (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
    ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)

  const token: Address = ADDR.leverageToken
  const manager: Address = (ADDR.managerV2 ?? ADDR.manager) as Address
  const router: Address = (ADDR.routerV2 ?? ADDR.router) as Address

  console.info('[STEP] Using public RPC', { url: RPC.primary })
  const tokenConfig = getLeverageTokenConfig(token)
  const chainId = tokenConfig?.chainId ?? CHAIN_ID
  console.info('[STEP] Chain ID', { chainId })

  const collateralAsset = ADDR.weeth
  const debtAsset = ADDR.weth
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
    chainId,
    swap: {
      type: 'uniswapV2',
      router: uniswapRouter,
    },
  }
}

async function executeMintPath(ctx: WithForkCtx, scenario: RedeemScenario) {
  const { account, config, publicClient } = ctx
  const previousAdapter = process.env['TEST_QUOTE_ADAPTER']
  process.env['TEST_QUOTE_ADAPTER'] = 'uniswapv2'
  if (scenario.swap.type !== 'uniswapV2') {
    throw new Error('Redeem mint helper currently requires an Uniswap V2 swap configuration')
  }
  await seedUniswapV2PairLiquidity({
    router: scenario.swap.router,
    tokenA: scenario.collateralAsset,
    tokenB: scenario.debtAsset,
  })

  let mintOutcome: Awaited<ReturnType<typeof executeSharedMint>>
  try {
    mintOutcome = await executeSharedMint({
      account,
      publicClient,
      config,
      slippageBps: scenario.slippageBps,
    })
  } finally {
    if (typeof previousAdapter === 'string') {
      process.env['TEST_QUOTE_ADAPTER'] = previousAdapter
    } else {
      delete process.env['TEST_QUOTE_ADAPTER']
    }
  }

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
  const {
    token,
    router,
    manager,
    collateralAsset,
    sharesAfterMint,
    slippageBps,
    swap,
    debtAsset,
    chainId,
  } = scenario

  const sharesToRedeem = sharesAfterMint
  await approveIfNeeded(token, router, sharesToRedeem)

  if (swap.type === 'uniswapV2') {
    await seedUniswapV2PairLiquidity({
      router: swap.router,
      tokenA: collateralAsset,
      tokenB: debtAsset,
    })
  }

  console.info('[STEP] Planning redeem with shared swap adapter', {
    sharesToRedeem: sharesToRedeem.toString(),
  })

  const { quote: quoteCollateralToDebt, adapterType } = createCollateralToDebtQuote({
    chainId,
    routerAddress: router,
    swap,
    slippageBps,
    getPublicClient: (cid: number) => (cid === chainId ? publicClient : undefined),
  })

  console.info('[STEP] Using collateral swap adapter', { adapterType })

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

  if (swap.type === 'uniswapV2') {
    const swapRouterCall = plan.calls.find(
      (call) => call.target.toLowerCase() === swap.router.toLowerCase(),
    )
    expect(swapRouterCall).toBeDefined()
  }

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
