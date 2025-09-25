import { type Address, getAddress, type PublicClient, parseUnits } from 'viem'
import { describe, expect, it } from 'vitest'
import { orchestrateMint } from '@/domain/mint'
import {
  createDebtToCollateralQuote,
  type DebtToCollateralSwapConfig,
} from '@/domain/mint/utils/createDebtToCollateralQuote'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import {
  AVAILABLE_LEVERAGE_TOKENS,
  BACKEND,
  DEFAULT_CHAIN_ID,
  getAddressesForToken,
  mode,
} from '../../../shared/env'
import { readErc20Decimals } from '../../../shared/erc20'
import {
  approveIfNeeded,
  seedUniswapV2PairLiquidity,
  topUpErc20,
  topUpNative,
} from '../../../shared/funding'
import { type WithForkCtx, withFork } from '../../../shared/withFork'

const TOKENS_UNDER_TEST = AVAILABLE_LEVERAGE_TOKENS.filter(
  (token) => token.chainId === DEFAULT_CHAIN_ID,
)

const DEFAULT_SLIPPAGE_BPS = 50

type MintTestParams = {
  tokenDefinition: (typeof AVAILABLE_LEVERAGE_TOKENS)[number]
  slippageBps?: number
}

type MintExecutionResult = {
  orchestration: Awaited<ReturnType<typeof orchestrateMint>>
  mintedShares: bigint
}

if (mode !== 'tenderly') {
  throw new Error(
    `Mint integration requires a Tenderly backend. Detected backend mode '${BACKEND.mode}'.`,
  )
}

if (TOKENS_UNDER_TEST.length === 0) {
  throw new Error(
    'No leverage tokens configured for the current backend; update tests/shared/env to provide token metadata.',
  )
}

describe('Leverage Router V2 Mint (Tenderly VNet)', () => {
  for (const tokenDefinition of TOKENS_UNDER_TEST) {
    const testLabel = `${tokenDefinition.label} (${tokenDefinition.key})`

    it(`mints shares successfully for ${testLabel}`, async () => {
      const result = await runMintTest({ tokenDefinition })
      assertMintResult(result)
    })
  }
})

async function runMintTest({
  tokenDefinition,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
}: MintTestParams): Promise<MintExecutionResult> {
  return withFork(async (ctx) => runMintScenario({ ctx, tokenDefinition, slippageBps }))
}

type MintScenarioParams = {
  ctx: WithForkCtx
  tokenDefinition: (typeof AVAILABLE_LEVERAGE_TOKENS)[number]
  slippageBps: number
}

async function runMintScenario({
  ctx,
  tokenDefinition,
  slippageBps,
}: MintScenarioParams): Promise<MintExecutionResult> {
  const { account, publicClient, config } = ctx
  const { addresses, token, manager, router } = resolveTokenAddresses(tokenDefinition)
  return await withMintEnv(tokenDefinition.key, addresses.executor as Address, async () => {
    const { collateralAsset, debtAsset, equityInInputAsset } = await fetchTokenAssets({
      config,
      manager,
      token,
    })
    await fundAccount({
      account: account.address,
      collateralAsset,
      router,
      equityInInputAsset,
    })

    const effectiveSwapConfig = await ensureSwapLiquidity({
      swapConfig: resolveDebtSwapConfig({ tokenDefinition, addresses }),
      collateralAsset,
      debtAsset,
    })

    const quoteDebtToCollateral = buildQuoteAdapter({
      chainId: tokenDefinition.chainId,
      router,
      executor: addresses.executor as Address,
      publicClient,
      slippageBps,
      swapConfig: effectiveSwapConfig,
    })

    const sharesBefore = await readLeverageTokenBalanceOf(config, {
      address: token,
      args: [account.address],
    })

    const orchestration = await orchestrateMint({
      config,
      account: account.address,
      token,
      inputAsset: collateralAsset,
      equityInInputAsset,
      slippageBps,
      quoteDebtToCollateral,
      routerAddressV2: router,
      managerAddressV2: manager,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: orchestration.hash })
    if (receipt.status !== 'success') {
      throw new Error(`Mint transaction reverted: ${receipt.status}`)
    }

    const sharesAfter = await readLeverageTokenBalanceOf(config, {
      address: token,
      args: [account.address],
    })
    const mintedShares = sharesAfter - sharesBefore

    return { orchestration, mintedShares }
  })
}

function resolveTokenAddresses(tokenDefinition: (typeof AVAILABLE_LEVERAGE_TOKENS)[number]) {
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

async function withMintEnv<T>(
  tokenKey: string,
  executor: Address,
  run: () => Promise<T>,
): Promise<T> {
  const previousKey = process.env['E2E_LEVERAGE_TOKEN_KEY']
  const previousExecutor = process.env['VITE_MULTICALL_EXECUTOR_ADDRESS']
  const previousRouterVersion = process.env['VITE_ROUTER_VERSION']

  process.env['E2E_LEVERAGE_TOKEN_KEY'] = tokenKey
  process.env['VITE_ROUTER_VERSION'] = 'v2'
  process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

  try {
    return await run()
  } finally {
    if (previousKey) process.env['E2E_LEVERAGE_TOKEN_KEY'] = previousKey
    else delete process.env['E2E_LEVERAGE_TOKEN_KEY']

    if (previousExecutor) process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = previousExecutor
    else delete process.env['VITE_MULTICALL_EXECUTOR_ADDRESS']

    if (previousRouterVersion) process.env['VITE_ROUTER_VERSION'] = previousRouterVersion
    else delete process.env['VITE_ROUTER_VERSION']
  }
}

async function fetchTokenAssets({
  config,
  manager,
  token,
}: {
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  manager: Address
  token: Address
}) {
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    address: manager,
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    address: manager,
    args: [token],
  })

  const decimals = await readErc20Decimals(config, collateralAsset)
  const equityInInputAsset = parseUnits('10', decimals)

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
  addresses,
}: {
  tokenDefinition: (typeof AVAILABLE_LEVERAGE_TOKENS)[number]
  addresses: ReturnType<typeof getAddressesForToken>
}): DebtToCollateralSwapConfig {
  if (tokenDefinition.swap?.useLiFi ?? process.env['TEST_USE_LIFI'] === '1') {
    return { type: 'lifi', allowBridges: 'none' }
  }

  if (tokenDefinition.swap?.uniswapV2Router) {
    return { type: 'uniswapV2', router: tokenDefinition.swap.uniswapV2Router }
  }

  const v3Config = tokenDefinition.swap?.uniswapV3
  if (v3Config?.poolKey) {
    if (!addresses.uniswapV3?.pool) {
      throw new Error('Uniswap V3 configuration missing for leverage token')
    }
    return { type: 'uniswapV3', poolKey: v3Config.poolKey }
  }

  const fallbackRouter =
    (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
    ('0x4752ba5DBc23f44D87826276BF6Fd6b1c372ad24' as Address)

  if (!fallbackRouter) {
    throw new Error('Uniswap V2 router address required for fallback debt swap')
  }

  return { type: 'uniswapV2', router: fallbackRouter }
}

function assertMintResult({ orchestration, mintedShares }: MintExecutionResult): void {
  expect(orchestration.routerVersion).toBe('v2')
  expect(/^0x[0-9a-fA-F]{64}$/.test(orchestration.hash)).toBe(true)

  expect(mintedShares > 0n).toBe(true)

  if (orchestration.routerVersion === 'v2') {
    expect(mintedShares >= orchestration.plan.minShares).toBe(true)

    const expectedShares = orchestration.plan.expectedShares
    const delta =
      mintedShares >= expectedShares ? mintedShares - expectedShares : expectedShares - mintedShares
    const tolerance = expectedShares / 100n || 1n // allow up to 1% variance from preview

    expect(delta <= tolerance).toBe(true)
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
