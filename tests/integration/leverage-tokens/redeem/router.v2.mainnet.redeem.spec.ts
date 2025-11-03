import { type Address, erc20Abi, parseUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { orchestrateRedeem, planRedeem } from '@/domain/redeem'
import { createCollateralToDebtQuote } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, CHAIN_ID } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded } from '../../../shared/funding'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { type WithForkCtx, withFork } from '../../../shared/withFork'

const redeemSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

redeemSuite('Leverage Router V2 Redeem (Mainnet wstETH/ETH 25x)', () => {
  // TODO: Investigate why tests require higher slippage (250 bps vs 50 bps)
  // Likely due to price discrepancies between CoinGecko (used for slippage calc) and on-chain oracles
  const SLIPPAGE_BPS = 250

  it('redeems all minted shares into collateral asset using production config', async () => {
    const result = await runRedeemTest({ slippageBps: SLIPPAGE_BPS })
    assertRedeemPlan(result.plan, result.collateralAsset, result.payoutAsset)
    assertRedeemExecution(result)
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
}

async function runRedeemTest({ slippageBps }: { slippageBps: number }) {
  return withFork(async (ctx) => {
    const scenario = await prepareRedeemScenario(ctx, slippageBps)
    const mintOutcome = await executeMintPath(ctx, scenario)
    return performRedeem(ctx, { ...scenario, ...mintOutcome })
  })
}

async function prepareRedeemScenario(
  ctx: WithForkCtx,
  slippageBps: number,
): Promise<RedeemScenario> {
  const { config } = ctx
  const token: Address = ADDR.leverageToken
  const manager: Address = (ADDR.managerV2 ?? ADDR.manager) as Address
  const router: Address = (ADDR.routerV2 ?? ADDR.router) as Address

  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    args: [token],
  })

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
    chainId: mainnet.id,
  }
}

type MintExecution = { sharesAfterMint: bigint }

async function executeMintPath(ctx: WithForkCtx, scenario: RedeemScenario): Promise<MintExecution> {
  const { account, config, publicClient } = ctx

  const mintOutcome = await executeSharedMint({
    account,
    publicClient,
    config,
    slippageBps: scenario.slippageBps,
    chainIdOverride: mainnet.id,
  })

  const sharesAfterMint = await readLeverageTokenBalanceOf(config, {
    address: mintOutcome.token,
    args: [account.address],
  })
  expect(sharesAfterMint).toBeGreaterThan(0n)
  return { sharesAfterMint }
}

type RedeemExecutionResult = {
  plan: Awaited<ReturnType<typeof planRedeem>>
  redeemHash: `0x${string}`
  collateralDelta: bigint
  debtDelta: bigint
  sharesBefore: bigint
  sharesAfter: bigint
  sharesToRedeem: bigint
  slippageBps: number
  payoutAsset: Address | undefined
  collateralAsset: Address
  debtAsset: Address
}

async function performRedeem(
  ctx: WithForkCtx,
  scenario: RedeemScenario & { sharesAfterMint: bigint; payoutAsset?: Address },
): Promise<RedeemExecutionResult> {
  const { account, config, publicClient } = ctx
  const {
    token,
    router,
    collateralAsset,
    sharesAfterMint,
    slippageBps,
    debtAsset,
    chainId,
    payoutAsset,
  } = scenario

  const sharesToRedeem = sharesAfterMint
  await approveIfNeeded(token, router, sharesToRedeem)

  // Use production swap config for this token
  const tokenConfig = getLeverageTokenConfig(token, chainId)
  if (!tokenConfig) throw new Error(`No config found for token ${token} on chain ${chainId}`)

  const collateralToDebtConfig = tokenConfig.swaps?.collateralToDebt
  if (!collateralToDebtConfig) throw new Error(`No collateralToDebt swap config for token ${token}`)

  const { quote: quoteCollateralToDebt } = createCollateralToDebtQuote({
    chainId,
    routerAddress: router,
    swap: collateralToDebtConfig,
    slippageBps,
    getPublicClient: (cid: number) => (cid === chainId ? publicClient : undefined),
  })

  const plan = await planRedeem({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    chainId,
    ...(payoutAsset ? { outputAsset: payoutAsset } : {}),
    intent: 'exactOut',
  })

  const collateralBalanceBefore = await publicClient.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })

  const debtBalanceBefore = await publicClient.readContract({
    address: debtAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })

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
    routerAddress: router,
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
    collateralAsset,
    debtAsset,
  }
}

function assertRedeemPlan(
  plan: Awaited<ReturnType<typeof planRedeem>>,
  collateralAsset: Address,
  expectedPayout?: Address,
): void {
  expect(plan.sharesToRedeem).toBeGreaterThan(0n)
  expect(plan.expectedDebt).toBeGreaterThan(0n)
  expect(plan.calls.length).toBeGreaterThanOrEqual(1)

  const payoutAsset = plan.payoutAsset.toLowerCase()
  const expectedPayoutAsset = (expectedPayout ?? collateralAsset).toLowerCase()

  const hasApprovalOrWithdraw = plan.calls.some((call) => {
    if (call.target.toLowerCase() !== collateralAsset.toLowerCase()) return false
    return (
      call.data.startsWith('0x095ea7b3') || // ERC20 approve
      call.data.startsWith('0x2e1a7d4d') // WETH withdraw when using native path
    )
  })
  expect(hasApprovalOrWithdraw).toBe(true)

  if (expectedPayoutAsset === collateralAsset.toLowerCase()) {
    expect(plan.expectedCollateral).toBeGreaterThanOrEqual(0n)
  } else {
    expect(plan.expectedDebtPayout).toBeGreaterThanOrEqual(0n)
  }

  expect(payoutAsset).toBe(expectedPayoutAsset)
}

function assertRedeemExecution(result: RedeemExecutionResult): void {
  const {
    plan,
    collateralDelta,
    debtDelta,
    sharesBefore,
    sharesAfter,
    sharesToRedeem,
    slippageBps,
    payoutAsset,
    collateralAsset,
  } = result

  expect(sharesAfter).toBe(sharesBefore - sharesToRedeem)

  // 1% tolerance for 25x leverage + LiFi routing variability
  const toleranceBps = BigInt(slippageBps) + 100n
  const withinTolerance = (actual: bigint, expected: bigint): boolean => {
    if (expected === 0n) return actual === 0n
    if (actual < 0n) return false
    const lowerBound = (expected * (10_000n - toleranceBps)) / 10_000n
    const upperBound = (expected * (10_000n + toleranceBps)) / 10_000n
    return actual >= lowerBound && actual <= upperBound
  }

  if (payoutAsset) {
    expect(collateralDelta).toBeLessThanOrEqual(plan.minCollateralForSender)
    expect(plan.expectedCollateral).toBe(0n)
    expect(withinTolerance(debtDelta, plan.payoutAmount)).toBe(true)
  } else {
    expect(collateralDelta).toBeGreaterThan(0n)
    expect(withinTolerance(collateralDelta, plan.expectedCollateral)).toBe(true)
  }

  expect(plan.payoutAsset.toLowerCase()).toBe((payoutAsset ?? collateralAsset).toLowerCase())
}
