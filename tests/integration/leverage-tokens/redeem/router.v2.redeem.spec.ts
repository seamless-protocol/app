import { type Address, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { orchestrateRedeem, planRedeemV2 } from '@/domain/redeem'
import {
  type CollateralToDebtSwapConfig,
  createCollateralToDebtQuote,
} from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { readLeverageTokenBalanceOf } from '@/lib/contracts/generated'
import { ADDR, CHAIN_ID, mode } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded, erc20Abi, seedUniswapV2PairLiquidity } from '../../../shared/funding'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { type WithForkCtx, withFork } from '../../../shared/withFork'

if (mode !== 'tenderly') {
  throw new Error(
    'Redeem integration requires a Tenderly backend. Update test configuration to use Tenderly VNet.',
  )
}

const redeemSuite = CHAIN_ID === base.id ? describe : describe.skip

redeemSuite('Leverage Router V2 Redeem (Tenderly VNet)', () => {
  const SLIPPAGE_BPS = 50

  it('redeems all minted shares into collateral asset via Uniswap v2 (baseline)', async () => {
    const result = await runRedeemTest({ slippageBps: SLIPPAGE_BPS })
    assertRedeemPlan(result.plan, result.swap, result.collateralAsset, result.payoutAsset)
    assertRedeemExecution(result, result.collateralAsset, result.debtAsset)
  }, 120_000)

  it('redeems all minted shares into debt asset when alternate output is selected', async () => {
    const result = await runRedeemTest({
      slippageBps: SLIPPAGE_BPS,
      payoutAsset: ADDR.weth,
    })
    assertRedeemPlan(result.plan, result.swap, result.collateralAsset, result.payoutAsset)
    assertRedeemExecution(result, result.collateralAsset, result.debtAsset)
  }, 120_000)
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

async function runRedeemTest({
  slippageBps,
  payoutAsset,
}: RedeemTestParams): Promise<RedeemExecutionResult> {
  return withFork(async (ctx) =>
    withRedeemEnv(async () => {
      const scenario = await prepareRedeemScenario(ctx, slippageBps)
      const mintOutcome = await executeMintPath(ctx, scenario)
      return performRedeem(ctx, {
        ...scenario,
        ...mintOutcome,
        ...(payoutAsset ? { payoutAsset } : {}),
      })
    }),
  )
}

async function prepareRedeemScenario(
  ctx: WithForkCtx,
  slippageBps: number,
): Promise<RedeemScenario> {
  const { config } = ctx

  const uniswapRouter =
    (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
    ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)

  const token: Address = ADDR.leverageToken
  const manager: Address = (ADDR.managerV2 ?? ADDR.manager) as Address
  const router: Address = (ADDR.routerV2 ?? ADDR.router) as Address

  const tokenConfig = getLeverageTokenConfig(token)
  const chainId = tokenConfig?.chainId ?? CHAIN_ID

  const collateralAsset = ADDR.weeth
  const debtAsset = ADDR.weth

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

type MintExecution = {
  sharesAfterMint: bigint
}

async function executeMintPath(ctx: WithForkCtx, scenario: RedeemScenario): Promise<MintExecution> {
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

type RedeemExecutionResult = {
  plan: Awaited<ReturnType<typeof planRedeemV2>>
  redeemHash: `0x${string}`
  collateralDelta: bigint
  debtDelta: bigint
  sharesBefore: bigint
  sharesAfter: bigint
  sharesToRedeem: bigint
  slippageBps: number
  payoutAsset: Address | undefined
  swap: RedeemScenario['swap']
  collateralAsset: Address
  debtAsset: Address
  equityInInputAsset: bigint
}

type RedeemTestParams = {
  slippageBps: number
  payoutAsset?: Address
}

async function performRedeem(
  ctx: WithForkCtx,
  scenario: RedeemScenario & { sharesAfterMint: bigint; payoutAsset?: Address },
): Promise<RedeemExecutionResult> {
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
    payoutAsset,
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

  const { quote: quoteCollateralToDebt } = createCollateralToDebtQuote({
    chainId,
    routerAddress: router,
    swap,
    slippageBps,
    getPublicClient: (cid: number) => (cid === chainId ? publicClient : undefined),
  })

  const plan = await planRedeemV2({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    chainId,
    managerAddress: manager,
    ...(payoutAsset ? { outputAsset: payoutAsset } : {}),
  })

  const collateralBalanceBefore = (await publicClient.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })) as bigint

  const debtBalanceBefore = (await publicClient.readContract({
    address: debtAsset,
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
    chainId,
    routerAddressV2: router,
    managerAddressV2: manager,
    ...(payoutAsset ? { outputAsset: payoutAsset } : {}),
  })

  const redeemReceipt = await publicClient.waitForTransactionReceipt({ hash: redeemTx.hash })
  if (redeemReceipt.status !== 'success') {
    throw new Error(`Redeem transaction reverted: ${redeemReceipt.status}`)
  }

  const sharesAfterRedeem = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account.address],
  })

  const collateralBalanceAfter = await publicClient.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })

  const debtBalanceAfter = await publicClient.readContract({
    address: debtAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })

  const collateralDelta = collateralBalanceAfter - collateralBalanceBefore
  const debtDelta = debtBalanceAfter - debtBalanceBefore

  return {
    plan,
    redeemHash: redeemTx.hash,
    collateralDelta,
    debtDelta,
    sharesBefore: sharesBeforeRedeem,
    sharesAfter: sharesAfterRedeem,
    sharesToRedeem,
    slippageBps,
    payoutAsset,
    swap,
    collateralAsset,
    debtAsset,
    equityInInputAsset: scenario.equityInInputAsset,
  }
}

async function withRedeemEnv<T>(run: () => Promise<T>): Promise<T> {
  const prevExecutor = process.env['VITE_MULTICALL_EXECUTOR_ADDRESS']

  const executor = ADDR.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }
  process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

  try {
    return await run()
  } finally {
    if (prevExecutor) process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = prevExecutor
    else delete process.env['VITE_MULTICALL_EXECUTOR_ADDRESS']
  }
}

function assertRedeemPlan(
  plan: Awaited<ReturnType<typeof planRedeemV2>>,
  swap: RedeemScenario['swap'],
  collateralAsset: Address,
  expectedPayout?: Address,
): void {
  expect(plan.sharesToRedeem > 0n).toBe(true)
  expect(plan.expectedDebt > 0n).toBe(true)
  expect(plan.calls.length).toBeGreaterThanOrEqual(1)

  const payoutAsset = plan.payoutAsset.toLowerCase()
  const expectedPayoutAsset = (expectedPayout ?? collateralAsset).toLowerCase()

  if (swap.type === 'uniswapV2') {
    const swapRouterCall = plan.calls.find(
      (call) => call.target.toLowerCase() === swap.router.toLowerCase(),
    )
    expect(swapRouterCall).toBeDefined()
  }

  const hasApprovalOrWithdraw = plan.calls.some((call) => {
    if (call.target.toLowerCase() !== collateralAsset.toLowerCase()) return false
    return (
      call.data.startsWith('0x095ea7b3') || // ERC20 approve
      call.data.startsWith('0x2e1a7d4d') // WETH withdraw when using native path
    )
  })
  expect(hasApprovalOrWithdraw).toBe(true)

  if (expectedPayoutAsset === collateralAsset.toLowerCase()) {
    expect(plan.expectedCollateral >= 0n).toBe(true)
  } else {
    expect(plan.expectedDebtPayout >= 0n).toBe(true)
  }

  expect(payoutAsset).toBe(expectedPayoutAsset)
}

function assertRedeemExecution(
  result: RedeemExecutionResult,
  collateralAsset: Address,
  debtAsset: Address,
): void {
  const {
    plan,
    redeemHash,
    collateralDelta,
    debtDelta,
    sharesBefore,
    sharesAfter,
    sharesToRedeem,
    slippageBps,
    payoutAsset,
  } = result

  expect(/^0x[0-9a-fA-F]{64}$/.test(redeemHash)).toBe(true)
  expect(sharesAfter).toBe(sharesBefore - sharesToRedeem)

  const toleranceBps = BigInt(slippageBps) + 10n
  const withinTolerance = (actual: bigint, expected: bigint): boolean => {
    if (expected === 0n) return actual === 0n
    if (actual < 0n) return false
    const lowerBound = (expected * (10_000n - toleranceBps)) / 10_000n
    const upperBound = (expected * (10_000n + toleranceBps)) / 10_000n
    return actual >= lowerBound && actual <= upperBound
  }

  if (payoutAsset) {
    expect(collateralDelta <= plan.minCollateralForSender).toBe(true)
    expect(plan.expectedCollateral).toBe(0n)
    expect(withinTolerance(debtDelta, plan.payoutAmount)).toBe(true)
  } else {
    expect(collateralDelta >= plan.minCollateralForSender).toBe(true)
    expect(withinTolerance(collateralDelta, plan.expectedCollateral)).toBe(true)
    // Additional round-trip sanity: collateral received should be within a
    // conservative bound of initial equity (loss cap 1%)
    const expectedMin = (result.equityInInputAsset * 9900n) / 10000n
    expect(collateralDelta >= expectedMin).toBe(true)
  }

  // sanity: plan payout asset aligns with selected output
  expect(plan.payoutAsset.toLowerCase()).toBe((payoutAsset ?? collateralAsset).toLowerCase())
  expect(collateralAsset).toBeDefined()
  expect(debtAsset).toBeDefined()
}
