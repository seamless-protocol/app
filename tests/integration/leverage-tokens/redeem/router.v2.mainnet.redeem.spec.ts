import { type Address, erc20Abi, parseUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { orchestrateRedeem, planRedeemV2 } from '@/domain/redeem'
import { createCollateralToDebtQuote } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, CHAIN_ID, mode } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded } from '../../../shared/funding'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { type WithForkCtx, withFork } from '../../../shared/withFork'

if (mode !== 'tenderly') {
  throw new Error(
    'Redeem integration requires a Tenderly backend. Update test configuration to use Tenderly VNet.',
  )
}

const redeemSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

redeemSuite('Leverage Router V2 Redeem (Tenderly VNet, Mainnet wstETH/ETH 25x)', () => {
  const SLIPPAGE_BPS = 50

  it('redeems all minted shares into collateral asset via LiFi', async () => {
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
  const previousAdapter = process.env['TEST_USE_LIFI']
  process.env['TEST_USE_LIFI'] = '1'

  let mintOutcome: Awaited<ReturnType<typeof executeSharedMint>>
  try {
    mintOutcome = await executeSharedMint({
      account,
      publicClient,
      config,
      slippageBps: scenario.slippageBps,
      chainIdOverride: mainnet.id,
    })
  } finally {
    if (typeof previousAdapter === 'string') process.env['TEST_USE_LIFI'] = previousAdapter
    else delete process.env['TEST_USE_LIFI']
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

  // Mirror production: use LiFi for the repay leg (same-chain, bridges disabled)
  const { quote: quoteCollateralToDebt } = createCollateralToDebtQuote({
    chainId,
    routerAddress: router,
    swap: { type: 'lifi', allowBridges: 'none' },
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
    ...(payoutAsset ? { outputAsset: payoutAsset } : {}),
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
    routerAddressV2: router,
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
  plan: Awaited<ReturnType<typeof planRedeemV2>>,
  collateralAsset: Address,
  expectedPayout?: Address,
): void {
  expect(plan.sharesToRedeem > 0n).toBe(true)
  expect(plan.expectedDebt > 0n).toBe(true)
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
    expect(plan.expectedCollateral >= 0n).toBe(true)
  } else {
    expect(plan.expectedDebtPayout >= 0n).toBe(true)
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
    expect(collateralDelta <= plan.minCollateralForSender).toBe(true)
    expect(plan.expectedCollateral).toBe(0n)
    expect(withinTolerance(debtDelta, plan.payoutAmount)).toBe(true)
  } else {
    expect(collateralDelta > 0n).toBe(true)
    expect(withinTolerance(collateralDelta, plan.expectedCollateral)).toBe(true)
  }

  expect(plan.payoutAsset.toLowerCase()).toBe((payoutAsset ?? collateralAsset).toLowerCase())
}
