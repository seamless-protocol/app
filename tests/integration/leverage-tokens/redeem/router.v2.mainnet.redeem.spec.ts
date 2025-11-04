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
import type { LeverageTokenKey } from '../../../fixtures/addresses'
import { CHAIN_ID, getAddressesForToken } from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import { approveIfNeeded } from '../../../shared/funding'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { type WithForkCtx, withFork } from '../../../shared/withFork'
import { MAINNET_TOKEN_CONFIGS } from '../mainnet-tokens.config'

const redeemSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

// TODO: Investigate why tests require higher slippage (250-500 bps vs 50 bps)
// Likely due to price discrepancies between CoinGecko (used for slippage calc) and on-chain oracles
describe.each(MAINNET_TOKEN_CONFIGS)('Leverage Router V2 Redeem (Mainnet $label)', (config) => {
  redeemSuite(`${config.label}`, () => {
    it('redeems all minted shares into collateral asset using production config', async () => {
      const result = await runRedeemTest({
        tokenKey: config.key,
        slippageBps: config.slippageBps,
        toleranceBps: config.toleranceBps,
        fundingAmount: config.fundingAmount,
        richHolderAddress: config.richHolderAddress,
      })
      assertRedeemPlan(result.plan, result.collateralAsset, result.payoutAsset)
      assertRedeemExecution(result)
    }, 30_000)
  })
})

type RedeemScenario = {
  token: Address
  manager: Address
  router: Address
  collateralAsset: Address
  debtAsset: Address
  equityInInputAsset: bigint
  slippageBps: number
  toleranceBps: number
  richHolderAddress: Address
  chainId: number
}

async function runRedeemTest({
  tokenKey,
  slippageBps,
  toleranceBps,
  fundingAmount,
  richHolderAddress,
}: {
  tokenKey: LeverageTokenKey
  slippageBps: number
  toleranceBps: number
  fundingAmount: string
  richHolderAddress: Address
}) {
  return withFork(async (ctx) => {
    const scenario = await prepareRedeemScenario(ctx, {
      tokenKey,
      slippageBps,
      fundingAmount,
      toleranceBps,
      richHolderAddress,
    })
    const mintOutcome = await executeMintPath(ctx, scenario)
    return performRedeem(ctx, { ...scenario, ...mintOutcome })
  })
}

async function prepareRedeemScenario(
  ctx: WithForkCtx,
  params: {
    tokenKey: LeverageTokenKey
    slippageBps: number
    fundingAmount: string
    toleranceBps: number
    richHolderAddress: Address
  },
): Promise<RedeemScenario> {
  const { config } = ctx
  const addresses = getAddressesForToken(params.tokenKey, 'prod')

  const token: Address = addresses.leverageToken
  const manager: Address = (addresses.managerV2 ?? addresses.manager) as Address
  const router: Address = (addresses.routerV2 ?? addresses.router) as Address

  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    args: [token],
  })

  const decimals = await readErc20Decimals(config, collateralAsset)
  const equityInInputAsset = parseUnits(params.fundingAmount, decimals)

  return {
    token,
    manager,
    router,
    collateralAsset,
    debtAsset,
    equityInInputAsset,
    slippageBps: params.slippageBps,
    toleranceBps: params.toleranceBps,
    richHolderAddress: params.richHolderAddress,
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
    richHolderAddress: scenario.richHolderAddress,
    chainIdOverride: mainnet.id,
    addresses: {
      token: scenario.token,
      manager: scenario.manager,
      router: scenario.router,
    },
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
  toleranceBps: number
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
    slippageBps: scenario.slippageBps,
    toleranceBps: scenario.toleranceBps,
    payoutAsset,
    collateralAsset: scenario.collateralAsset,
    debtAsset: scenario.debtAsset,
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
    toleranceBps,
    payoutAsset,
    collateralAsset,
  } = result

  expect(sharesAfter).toBe(sharesBefore - sharesToRedeem)

  // Add extra tolerance for LiFi routing variability
  const effectiveToleranceBps = BigInt(toleranceBps) + 100n
  const withinTolerance = (actual: bigint, expected: bigint): boolean => {
    if (expected === 0n) return actual === 0n
    if (actual < 0n) return false
    const lowerBound = (expected * (10_000n - effectiveToleranceBps)) / 10_000n
    const upperBound = (expected * (10_000n + effectiveToleranceBps)) / 10_000n
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
