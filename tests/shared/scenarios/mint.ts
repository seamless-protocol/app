import { type Address, getAddress, type PublicClient, parseUnits, erc20Abi } from 'viem'
import { orchestrateMint } from '@/domain/mint'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'
import { createManagerPortV2 } from '@/domain/mint/ports'
import {
  createDebtToCollateralQuote,
  type DebtToCollateralSwapConfig,
} from '@/domain/mint/utils/createDebtToCollateralQuote'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import type { LeverageTokenDefinition } from '../../fixtures/addresses'
import { AVAILABLE_LEVERAGE_TOKENS, getAddressesForToken } from '../env'
import { readErc20Decimals } from '../erc20'
import { approveIfNeeded, seedUniswapV2PairLiquidity, topUpErc20, topUpNative } from '../funding'
import { type WithForkCtx, withFork } from '../withFork'

const DEFAULT_SLIPPAGE_BPS = (() => {
  const raw = process.env['TEST_SLIPPAGE_BPS']
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : 50
})()
const DEFAULT_EQUITY_HUMAN = process.env['TEST_EQUITY_HUMAN'] || '10'

export type MintTestParams = {
  tokenDefinition: LeverageTokenDefinition
  slippageBps?: number
  equityAmountHuman?: string
}

export type MintExecutionResult = {
  orchestration: Awaited<ReturnType<typeof orchestrateMint>>
  mintedShares: bigint
  /** User collateral actually spent during mint (balanceBefore - balanceAfter) */
  collateralDelta?: bigint
  /** For sanity checks down the line */
  equityInInputAsset?: bigint
  collateralAsset?: Address
}

export type MintPlanResult = {
  plan: Awaited<ReturnType<typeof planMintV2>>
  collateralAsset: Address
  debtAsset: Address
  equityInInputAsset: bigint
}

export type MintPlanningContext = Pick<WithForkCtx, 'config' | 'publicClient'>

export async function runMintTest({
  tokenDefinition,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  equityAmountHuman = DEFAULT_EQUITY_HUMAN,
}: MintTestParams): Promise<MintExecutionResult> {
  return withFork(async (ctx) =>
    runMintScenario({ ctx, tokenDefinition, slippageBps, equityAmountHuman }),
  )
}

export async function planMintTest({
  ctx,
  tokenDefinition,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  equityAmountHuman = DEFAULT_EQUITY_HUMAN,
}: MintTestParams & { ctx: MintPlanningContext }): Promise<MintPlanResult> {
  const setup = await prepareMintScenario({
    config: ctx.config,
    publicClient: ctx.publicClient,
    tokenDefinition,
    slippageBps,
    equityAmountHuman,
    ensureLiquidity: false,
  })

  const managerPort = createManagerPortV2({ config: ctx.config, routerAddress: setup.router })

  const plan = await planMintV2({
    config: ctx.config,
    token: setup.token,
    inputAsset: setup.collateralAsset,
    equityInInputAsset: setup.equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral: setup.quoteDebtToCollateral,
    managerPort,
    managerAddress: setup.manager,
    chainId: tokenDefinition.chainId,
  })

  return {
    plan,
    collateralAsset: setup.collateralAsset,
    debtAsset: setup.debtAsset,
    equityInInputAsset: setup.equityInInputAsset,
  }
}

export async function ensureMintLiquidity({
  ctx,
  tokenDefinition,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  equityAmountHuman = DEFAULT_EQUITY_HUMAN,
}: MintTestParams & { ctx: MintPlanningContext }): Promise<void> {
  await prepareMintScenario({
    config: ctx.config,
    publicClient: ctx.publicClient,
    tokenDefinition,
    slippageBps,
    equityAmountHuman,
    ensureLiquidity: true,
  })
}

type MintScenarioParams = {
  ctx: WithForkCtx
  tokenDefinition: LeverageTokenDefinition
  slippageBps: number
  equityAmountHuman: string
}

async function runMintScenario({
  ctx,
  tokenDefinition,
  slippageBps,
  equityAmountHuman,
}: MintScenarioParams): Promise<MintExecutionResult> {
  const { account, config, publicClient } = ctx
  const setup = await prepareMintScenario({
    config,
    publicClient,
    tokenDefinition,
    slippageBps,
    equityAmountHuman,
  })

  await fundAccount({
    account: account.address,
    collateralAsset: setup.collateralAsset,
    router: setup.router,
    equityInInputAsset: setup.equityInInputAsset,
  })

  const sharesBefore = await readLeverageTokenBalanceOf(config, {
    address: setup.token,
    args: [account.address],
  })

  // Capture user collateral balance before mint for accounting sanity
  const collateralBalanceBefore = (await publicClient.readContract({
    address: setup.collateralAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })) as bigint

  const orchestration = await orchestrateMint({
    config,
    account: account.address,
    token: setup.token,
    inputAsset: setup.collateralAsset,
    equityInInputAsset: setup.equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral: setup.quoteDebtToCollateral,
    routerAddressV2: setup.router,
    managerAddressV2: setup.manager,
    chainId: tokenDefinition.chainId,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: orchestration.hash })
  if (receipt.status !== 'success') {
    throw new Error(`Mint transaction reverted: ${receipt.status}`)
  }

  const sharesAfter = await readLeverageTokenBalanceOf(config, {
    address: setup.token,
    args: [account.address],
  })
  const mintedShares = sharesAfter - sharesBefore

  const collateralBalanceAfter = (await publicClient.readContract({
    address: setup.collateralAsset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  })) as bigint
  const collateralDelta = collateralBalanceBefore - collateralBalanceAfter

  return {
    orchestration,
    mintedShares,
    collateralDelta,
    equityInInputAsset: setup.equityInInputAsset,
    collateralAsset: setup.collateralAsset,
  }
}

function resolveTokenAddresses(tokenDefinition: LeverageTokenDefinition) {
  const addresses = getAddressesForToken(tokenDefinition.key)
  const executor = addresses.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }

  const token = addresses.leverageToken
  const manager = (addresses.managerV2 ?? addresses.manager) as Address
  const router = (addresses.routerV2 ?? addresses.router) as Address

  return { addresses, token, manager, router }
}

async function prepareMintScenario({
  config,
  publicClient,
  tokenDefinition,
  slippageBps,
  equityAmountHuman,
  ensureLiquidity = true,
}: {
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  publicClient: PublicClient
  tokenDefinition: LeverageTokenDefinition
  slippageBps: number
  equityAmountHuman: string
  ensureLiquidity?: boolean
}): Promise<{
  token: Address
  manager: Address
  router: Address
  collateralAsset: Address
  debtAsset: Address
  equityInInputAsset: bigint
  quoteDebtToCollateral: ReturnType<typeof buildQuoteAdapter>
}> {
  const { addresses, token, manager, router } = resolveTokenAddresses(tokenDefinition)

  const { collateralAsset, debtAsset, equityInInputAsset } = await fetchTokenAssets({
    config,
    token,
    equityAmountHuman,
  })

  const swapConfig = resolveDebtSwapConfig({ tokenDefinition })
  const effectiveSwapConfig = ensureLiquidity
    ? await ensureSwapLiquidity({
        swapConfig,
        collateralAsset,
        debtAsset,
      })
    : swapConfig

  const quoteDebtToCollateral = buildQuoteAdapter({
    chainId: tokenDefinition.chainId,
    router,
    executor: addresses.executor as Address,
    publicClient,
    slippageBps,
    swapConfig: effectiveSwapConfig,
  })

  return {
    token,
    manager,
    router,
    collateralAsset,
    debtAsset,
    equityInInputAsset,
    quoteDebtToCollateral,
  }
}

async function fetchTokenAssets({
  config,
  token,
  equityAmountHuman,
}: {
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  token: Address
  equityAmountHuman: string
}) {
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    args: [token],
  })

  const decimals = await readErc20Decimals(config, collateralAsset)
  const equityInInputAsset = parseUnits(equityAmountHuman, decimals)

  return { collateralAsset, debtAsset, equityInInputAsset }
}

async function fundAccount({
  account,
  collateralAsset,
  router,
  equityInInputAsset,
}: {
  account: Address
  collateralAsset: Address
  router: Address
  equityInInputAsset: bigint
}) {
  await topUpNative(account, '1')
  await topUpErc20(collateralAsset, account, '25')
  await approveIfNeeded(collateralAsset, router, equityInInputAsset)
}

function buildQuoteAdapter({
  chainId,
  router,
  executor,
  publicClient,
  slippageBps,
  swapConfig,
}: {
  chainId: number
  router: Address
  executor: Address
  publicClient: PublicClient
  slippageBps: number
  swapConfig: DebtToCollateralSwapConfig
}) {
  const { quote } = createDebtToCollateralQuote({
    chainId,
    routerAddress: router,
    swap: swapConfig,
    slippageBps,
    getPublicClient: (cid: number) => (cid === chainId ? publicClient : undefined),
    fromAddress: executor,
  })
  return quote
}

function resolveDebtSwapConfig({
  tokenDefinition,
}: {
  tokenDefinition: LeverageTokenDefinition
}): DebtToCollateralSwapConfig {
  if (tokenDefinition.swap?.useLiFi ?? process.env['TEST_USE_LIFI'] === '1') {
    return { type: 'lifi', allowBridges: 'none' }
  }

  const v3Config = tokenDefinition.swap?.uniswapV3
  // Prefer Uniswap V3 when poolKey is provided (Tenderly tokens aim for deterministic v3 routes)
  if (v3Config?.poolKey) {
    return { type: 'uniswapV3', poolKey: v3Config.poolKey }
  }

  if (tokenDefinition.swap?.uniswapV2Router) {
    return { type: 'uniswapV2', router: tokenDefinition.swap.uniswapV2Router }
  }

  const fallbackRouter =
    (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
    ('0x4752ba5DBc23f44D87826276BF6Fd6b1c372ad24' as Address)

  if (!fallbackRouter) {
    throw new Error('Uniswap V2 router address required for fallback debt swap')
  }

  return { type: 'uniswapV2', router: fallbackRouter }
}

export function assertMintResult({
  orchestration,
  mintedShares,
  collateralDelta,
  equityInInputAsset,
}: MintExecutionResult): void {
  if (!/^0x[0-9a-fA-F]{64}$/.test(orchestration.hash)) {
    throw new Error(`Invalid transaction hash returned from mint: ${orchestration.hash}`)
  }

  if (mintedShares <= 0n) {
    throw new Error('Mint produced zero shares; expected positive result.')
  }

  const { plan } = orchestration
  if (mintedShares < plan.minShares) {
    throw new Error(`Minted shares ${mintedShares} fell below plan minimum ${plan.minShares}.`)
  }

  const expectedShares = plan.expectedShares
  const delta =
    mintedShares >= expectedShares ? mintedShares - expectedShares : expectedShares - mintedShares
  const tolerance = expectedShares / 100n || 1n // allow up to 1% variance from preview

  if (delta > tolerance) {
    throw new Error(
      `Minted shares ${mintedShares} deviate from expected ${expectedShares} beyond tolerance ${tolerance}.`,
    )
  }

  // Optional accounting sanity: user collateral spent equals declared equity
  if (typeof collateralDelta === 'bigint' && typeof equityInInputAsset === 'bigint') {
    if (collateralDelta !== equityInInputAsset) {
      throw new Error(
        `Collateral delta ${collateralDelta} does not equal equityInInputAsset ${equityInInputAsset}.`,
      )
    }
  }
}

async function ensureSwapLiquidity({
  swapConfig,
  collateralAsset,
  debtAsset,
}: {
  swapConfig: DebtToCollateralSwapConfig
  collateralAsset: Address
  debtAsset: Address
}): Promise<DebtToCollateralSwapConfig> {
  if (swapConfig.type !== 'uniswapV2') return swapConfig
  const routerAddress = getAddress(swapConfig.router)
  await seedUniswapV2PairLiquidity({
    router: routerAddress,
    tokenA: collateralAsset,
    tokenB: debtAsset,
  })
  return { ...swapConfig, router: routerAddress }
}

export function listMintTokenDefinitions(): Array<LeverageTokenDefinition> {
  return AVAILABLE_LEVERAGE_TOKENS
}
