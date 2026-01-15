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
import { createTestBalmySDK } from '../../../shared/clients'
import { CHAIN_ID, getAddressesForToken } from '../../../shared/env'
import { approveIfNeeded } from '../../../shared/funding'
import { executeSharedMint } from '../../../shared/mintHelpers'
import { type WithForkCtx, withFork } from '../../../shared/withFork'
import { MAINNET_TOKEN_CONFIGS } from '../mainnet-tokens.config'

const redeemSuite = CHAIN_ID === mainnet.id ? describe : describe.skip

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
      assertRedeemPlan(result.plan, result.collateralAsset)
      assertRedeemExecution(result)
    }, 60_000)
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
  multicallExecutor: Address
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

  const leverageTokenConfig = getLeverageTokenConfig(token, mainnet.id)
  if (!leverageTokenConfig) {
    throw new Error(`Leverage token config not found for ${token}`)
  }
  const decimals = leverageTokenConfig.collateralAsset.decimals
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
    multicallExecutor: addresses.multicallExecutor as Address,
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
      multicallExecutor: scenario.multicallExecutor,
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
  collateralAsset: Address
  debtAsset: Address
}

async function performRedeem(
  ctx: WithForkCtx,
  scenario: RedeemScenario & { sharesAfterMint: bigint },
): Promise<RedeemExecutionResult> {
  const { account, config, publicClient } = ctx
  const { token, router, collateralAsset, sharesAfterMint, slippageBps, debtAsset, chainId } =
    scenario

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
    getPublicClient: (cid: number) => (cid === chainId ? publicClient : undefined),
    balmySDK: createTestBalmySDK(),
  })

  const blockNumber = await publicClient.getBlockNumber()

  const plan = await planRedeem({
    wagmiConfig: config,
    leverageTokenConfig: tokenConfig,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    blockNumber,
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
    plan,
    chainId,
    routerAddress: router,
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
    collateralAsset: scenario.collateralAsset,
    debtAsset: scenario.debtAsset,
  }
}

function assertRedeemPlan(
  plan: Awaited<ReturnType<typeof planRedeem>>,
  collateralAsset: Address,
): void {
  expect(plan.sharesToRedeem).toBeGreaterThan(0n)
  expect(plan.minCollateralForSender).toBeGreaterThan(0n)
  expect(plan.calls.length).toBeGreaterThanOrEqual(1)

  const hasApprovalOrWithdraw = plan.calls.some((call) => {
    if (call.target.toLowerCase() !== collateralAsset.toLowerCase()) return false
    return (
      call.data.startsWith('0x095ea7b3') || // ERC20 approve
      call.data.startsWith('0x2e1a7d4d') // WETH withdraw when using native path
    )
  })
  expect(hasApprovalOrWithdraw).toBe(true)
}

function assertRedeemExecution(result: RedeemExecutionResult): void {
  const { plan, collateralDelta, sharesBefore, sharesAfter, sharesToRedeem, toleranceBps } = result

  expect(sharesAfter).toBe(sharesBefore - sharesToRedeem)

  // Add extra tolerance for routing variability
  const effectiveToleranceBps = BigInt(toleranceBps) + 100n
  const withinTolerance = (actual: bigint, expected: bigint): boolean => {
    if (expected === 0n) return actual === 0n
    if (actual < 0n) return false
    const lowerBound = (expected * (10_000n - effectiveToleranceBps)) / 10_000n
    const upperBound = (expected * (10_000n + effectiveToleranceBps)) / 10_000n
    return actual >= lowerBound && actual <= upperBound
  }

  expect(collateralDelta).toBeGreaterThan(0n)
  expect(withinTolerance(collateralDelta, plan.previewCollateralForSender)).toBe(true)
}
