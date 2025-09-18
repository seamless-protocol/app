import { type Address, type PublicClient, parseUnits } from 'viem'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { orchestrateRedeem, planRedeemV2 } from '@/domain/redeem'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'
import { createUniswapV2QuoteAdapter } from '@/domain/shared/adapters/uniswapV2'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, mode, RPC } from '../../../shared/env'
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

  it('redeems shares successfully (happy path — currently blocked by swap plumbing)', async () =>
    withFork(async (ctx) => {
      ensureTenderlyMode()
      const scenario = await loadScenario(ctx, SLIPPAGE_BPS)
      const { sharesMinted } = await mintAndAssert(ctx, scenario)
      await redeemAndAssert(ctx, { ...scenario, sharesMinted })
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
}

async function loadScenario(ctx: WithForkCtx, slippageBps: number): Promise<RedeemScenario> {
  const { config } = ctx

  process.env['VITE_ROUTER_VERSION'] = 'v2'
  const executor = ADDR.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }
  process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

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
  }
}

async function mintAndAssert(ctx: WithForkCtx, scenario: RedeemScenario) {
  const { account, config, publicClient } = ctx
  const { token, router, collateralAsset, equityInInputAsset, slippageBps, manager } = scenario

  console.info('[STEP] Funding + approving collateral for mint', {
    collateralAsset,
    equityInInputAsset: equityInInputAsset.toString(),
  })
  await topUpNative(account.address, '1')
  await topUpErc20(collateralAsset, account.address, '25')
  await approveIfNeeded(collateralAsset, router, equityInInputAsset)

  const mintQuote = createUniswapV2QuoteAdapter({
    publicClient: publicClient as unknown as Pick<PublicClient, 'readContract' | 'getBlock'>,
    router: ((process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
      '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24') as Address,
    recipient: router,
    wrappedNative: ADDR.weth,
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

  return { sharesMinted: sharesAfterMint }
}

async function redeemAndAssert(
  ctx: WithForkCtx,
  scenario: RedeemScenario & { sharesMinted: bigint },
): Promise<void> {
  const { account, config, publicClient } = ctx
  const { token, router, executor, manager, chainId, collateralAsset, sharesMinted, slippageBps } = scenario

  const sharesToRedeem = sharesMinted / 2n
  await approveIfNeeded(token, router, sharesToRedeem)

  console.info('[STEP] Planning redeem with LiFi adapter', {
    sharesToRedeem: sharesToRedeem.toString(),
  })

  const quoteCollateralToDebt = createLifiQuoteAdapter({
    chainId,
    router,
    fromAddress: executor,
    allowBridges: 'none',
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
  const approvalCalls = plan.calls.filter((call) => call.data.startsWith('0x095ea7b3'))
  expect(approvalCalls.length).toBeGreaterThan(0)
  const swapCalls = plan.calls.filter((call) => !call.data.startsWith('0x095ea7b3'))
  expect(swapCalls.length).toBeGreaterThan(0)

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
