import { type Address, getAddress, type PublicClient } from 'viem'
import { createBalmySDK } from '@/components/BalmySDKProvider'
import { planRedeem } from '@/domain/redeem'
import {
  type CollateralToDebtSwapConfig,
  createCollateralToDebtQuote,
} from '@/domain/redeem/utils/createCollateralToDebtQuote'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import type { LeverageTokenDefinition } from '../../fixtures/addresses'
import { AVAILABLE_LEVERAGE_TOKENS, getAddressesForToken } from '../env'
import { seedUniswapV2PairLiquidity } from '../funding'
import { executeSharedMint } from '../mintHelpers'

const DEFAULT_SLIPPAGE_BPS = 50

export type RedeemPlanningContext = {
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  publicClient: PublicClient
  account: { address: Address }
}

export type RedeemScenarioConfig = {
  token: Address
  manager: Address
  router: Address
  collateralAsset: Address
  debtAsset: Address
  swap: CollateralToDebtSwapConfig
  chainId: number
  multicallExecutor: Address
}

export type RedeemPlanResult = {
  plan: Awaited<ReturnType<typeof planRedeem>>
  collateralAsset: Address
  debtAsset: Address
}

export type RedeemSetupResult = RedeemScenarioConfig & {
  sharesToRedeem: bigint
}

type RedeemPlanParams = {
  ctx: RedeemPlanningContext
  tokenDefinition: LeverageTokenDefinition
  sharesToRedeem: bigint
  slippageBps?: number
}

type RedeemSetupParams = {
  ctx: RedeemPlanningContext
  tokenDefinition: LeverageTokenDefinition
  slippageBps?: number
}

export function listRedeemTokenDefinitions(): Array<LeverageTokenDefinition> {
  return AVAILABLE_LEVERAGE_TOKENS
}

export async function ensureRedeemSetup({
  ctx,
  tokenDefinition,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
}: RedeemSetupParams): Promise<RedeemSetupResult> {
  const scenario = await resolveRedeemScenario({
    ctx,
    tokenDefinition,
  })

  if (scenario.swap.type === 'uniswapV2') {
    await seedUniswapV2PairLiquidity({
      router: getAddress(scenario.swap.router),
      tokenA: scenario.collateralAsset,
      tokenB: scenario.debtAsset,
    })
  }

  const previousEquity = process.env['TEST_EQUITY_AMOUNT']
  process.env['TEST_EQUITY_AMOUNT'] = '10'
  // Simple fix: when scenario prefers LiFi, force mint helper to use LiFi
  const prevUseLifi = process.env['TEST_USE_LIFI']
  if (scenario.swap.type === 'lifi') process.env['TEST_USE_LIFI'] = '1'
  try {
    await executeSharedMint({
      account: ctx.account,
      publicClient: ctx.publicClient,
      config: ctx.config,
      slippageBps,
      chainIdOverride: scenario.chainId,
      // Ensure we mint the exact leverage token we're about to redeem
      addresses: {
        token: scenario.token,
        manager: scenario.manager,
        router: scenario.router,
        multicallExecutor: scenario.multicallExecutor,
      },
    })
  } finally {
    if (typeof previousEquity === 'string') process.env['TEST_EQUITY_AMOUNT'] = previousEquity
    else delete process.env['TEST_EQUITY_AMOUNT']
    if (typeof prevUseLifi === 'string') process.env['TEST_USE_LIFI'] = prevUseLifi
    else delete process.env['TEST_USE_LIFI']
  }

  const sharesToRedeem = await readLeverageTokenBalanceOf(ctx.config, {
    address: scenario.token,
    args: [ctx.account.address],
  })

  return {
    ...scenario,
    sharesToRedeem,
  }
}

export async function planRedeemTest({
  ctx,
  tokenDefinition,
  sharesToRedeem,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
}: RedeemPlanParams): Promise<RedeemPlanResult> {
  const scenario = await resolveRedeemScenario({
    ctx,
    tokenDefinition,
  })

  const { quote: quoteCollateralToDebt } = createCollateralToDebtQuote({
    chainId: scenario.chainId,
    routerAddress: scenario.router,
    swap: scenario.swap,
    getPublicClient: (cid: number) => (cid === scenario.chainId ? ctx.publicClient : undefined),
    balmySDK: createBalmySDK(ctx.config),
  })

  const leverageTokenConfig = getLeverageTokenConfig(scenario.token, scenario.chainId)
  if (!leverageTokenConfig) {
    throw new Error(`Leverage token config not found for ${scenario.token}`)
  }

  const plan = await planRedeem({
    publicClient: ctx.publicClient,
    leverageTokenConfig,
    sharesToRedeem,
    collateralSlippageBps: slippageBps,
    swapSlippageBps: slippageBps,
    collateralSwapAdjustmentBps: slippageBps,
    quoteCollateralToDebt,
  })

  return {
    plan,
    collateralAsset: scenario.collateralAsset,
    debtAsset: scenario.debtAsset,
  }
}

async function resolveRedeemScenario({
  ctx,
  tokenDefinition,
}: {
  ctx: RedeemPlanningContext
  tokenDefinition: LeverageTokenDefinition
}): Promise<RedeemScenarioConfig> {
  const addresses = getAddressesForToken(tokenDefinition.key)
  const multicallExecutor = addresses.multicallExecutor
  if (!multicallExecutor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }

  const token = addresses.leverageToken
  const manager = (addresses.managerV2 ?? addresses.manager) as Address
  const router = (addresses.routerV2 ?? addresses.router) as Address

  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(ctx.config, {
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(ctx.config, {
    args: [token],
  })

  const swap = resolveRedeemSwapConfig({ tokenDefinition, addresses })
  const chainId = tokenDefinition.chainId

  return {
    token,
    manager,
    router,
    collateralAsset,
    debtAsset,
    swap,
    chainId,
    multicallExecutor,
  }
}

function resolveRedeemSwapConfig({
  tokenDefinition,
  addresses,
}: {
  tokenDefinition: LeverageTokenDefinition
  addresses: ReturnType<typeof getAddressesForToken>
}): CollateralToDebtSwapConfig {
  const swap = tokenDefinition.swap
  if (swap?.type === 'lifi' || (swap?.type === undefined && process.env['TEST_USE_LIFI'] === '1')) {
    return { type: 'lifi', allowBridges: 'none' }
  }
  if (swap?.type === 'pendle') {
    return { type: 'pendle' }
  }

  if (swap?.uniswapV2Router) {
    return { type: 'uniswapV2', router: swap.uniswapV2Router }
  }

  const v3Config = swap?.uniswapV3
  if (v3Config?.poolKey) {
    if (!addresses.uniswapV3?.pool) {
      throw new Error('Uniswap V3 configuration missing for leverage token')
    }
    return { type: 'uniswapV3', poolKey: v3Config.poolKey }
  }

  const fallbackRouter =
    (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
    ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)

  if (!fallbackRouter) {
    throw new Error('Uniswap V2 router address required for fallback redeem swap')
  }

  return { type: 'uniswapV2', router: fallbackRouter }
}
