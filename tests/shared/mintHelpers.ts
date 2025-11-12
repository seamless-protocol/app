import type { Address, PublicClient } from 'viem'
import { parseUnits } from 'viem'
import { planMint } from '@/domain/mint/planner/plan'
import { createDebtToCollateralQuote } from '@/domain/mint/utils/createDebtToCollateralQuote'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import {
  createUniswapV2QuoteAdapter,
  type UniswapV2QuoteOptions,
} from '@/domain/shared/adapters/uniswapV2'
import {
  createUniswapV3QuoteAdapter,
  type UniswapV3QuoteOptions,
} from '@/domain/shared/adapters/uniswapV3'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
  simulateLeverageRouterV2Deposit,
  writeLeverageRouterV2Deposit,
} from '@/lib/contracts/generated'
import { ADDR, CHAIN_ID, RPC } from './env'
import { readErc20Decimals } from './erc20'
import { approveIfNeeded, topUpErc20, topUpNative } from './funding'

export type MintSetupParams = {
  account: { address: Address }
  publicClient: PublicClient
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  slippageBps?: number
  chainIdOverride?: number
  richHolderAddress?: Address
  // Optional: override addresses to ensure we mint the same token
  // that the calling scenario is planning to redeem.
  addresses?: {
    token: Address
    manager: Address
    router: Address
    uniswapV3?: {
      pool: Address
      fee: number
      quoter?: Address
      router?: Address
      tickSpacing?: number
    }
  }
}

export type MintOutcome = {
  equityInInputAsset: bigint
  collateralAsset: Address
  debtAsset: Address
  router: Address
  manager: Address
  token: Address
  sharesMinted: bigint
  minShares: bigint
  expectedShares: bigint
  expectedTotalCollateral: bigint
  collateralBalanceBefore: bigint
  collateralBalanceAfter: bigint
}

/**
 * Shared helper that mirrors the tenderly mint integration setup.
 * Returns minted shares plus key addresses for reuse in downstream flows (e.g., redeem).
 */
export async function executeSharedMint({
  account,
  publicClient,
  config,
  slippageBps = 50,
  chainIdOverride,
  richHolderAddress,
  addresses,
}: MintSetupParams): Promise<MintOutcome> {
  const resolvedSlippageBps = Number(process.env['TEST_SLIPPAGE_BPS'] ?? slippageBps ?? 50)

  const executor = ADDR.executor
  if (!executor) {
    throw new Error('Multicall executor address missing; update contract map for V2 harness')
  }
  process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] = executor

  const token: Address = (addresses?.token ?? ADDR.leverageToken) as Address
  const manager: Address = (addresses?.manager ?? ADDR.managerV2 ?? ADDR.manager) as Address
  const router: Address = (addresses?.router ?? ADDR.routerV2 ?? ADDR.router) as Address

  console.info('[SHARED MINT] Using public RPC', { url: RPC.primary })
  const chainId = chainIdOverride ?? CHAIN_ID
  console.info('[SHARED MINT] Chain ID', { chainId })

  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    args: [token],
  })
  console.info('[SHARED MINT] Token assets', { collateralAsset, debtAsset })

  const decimals = await readErc20Decimals(config, collateralAsset)
  const equityHuman = process.env['TEST_EQUITY_AMOUNT'] ?? '0.1'
  const equityInInputAsset = parseUnits(equityHuman, decimals)
  console.info('[SHARED MINT] Funding + approving collateral', {
    collateralAsset,
    equityInInputAsset: equityInInputAsset.toString(),
  })
  await topUpNative(account.address, '1')
  await topUpErc20(collateralAsset, account.address, '25', richHolderAddress)
  await approveIfNeeded(collateralAsset, router, equityInInputAsset)

  const quoteAdapterPreference = (process.env['TEST_QUOTE_ADAPTER'] ?? '').toLowerCase()
  const useLiFi = process.env['TEST_USE_LIFI'] === '1'

  // Check if production config specifies a swap adapter
  const tokenConfig = getLeverageTokenConfig(token, chainId)
  const debtToCollateralConfig = tokenConfig?.swaps?.debtToCollateral

  let quoteDebtToCollateral: QuoteFn

  // Use production config if available and no test override
  if (debtToCollateralConfig && !useLiFi && !quoteAdapterPreference) {
    console.info('[SHARED MINT] Using production config', {
      adapterType: debtToCollateralConfig.type,
    })
    const { quote } = createDebtToCollateralQuote({
      chainId,
      routerAddress: router,
      swap: debtToCollateralConfig,
      slippageBps: resolvedSlippageBps,
      getPublicClient: (cid: number) => (cid === chainId ? publicClient : undefined),
    })
    quoteDebtToCollateral = quote
  } else {
    // Fall back to test helper logic
    const uniswapV3Config = addresses?.uniswapV3 ?? ADDR.uniswapV3
    const canUseV3 = Boolean(
      uniswapV3Config?.quoter &&
        uniswapV3Config?.router &&
        uniswapV3Config?.pool &&
        typeof uniswapV3Config?.fee === 'number',
    )

    quoteDebtToCollateral = await resolveDebtToCollateralQuote({
      preference: quoteAdapterPreference,
      useLiFi,
      canUseV3,
      chainId,
      router,
      executor,
      resolvedSlippageBps,
      publicClient,
    })
  }

  const sharesBefore = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account.address],
  })

  const collateralBalanceBefore = await readLeverageTokenBalanceOf(config, {
    address: collateralAsset,
    args: [account.address],
  })

  console.info('[SHARED MINT] Planning mint')
  const plan = await planMint({
    config,
    token,
    inputAsset: collateralAsset,
    equityInInputAsset,
    slippageBps: resolvedSlippageBps,
    quoteDebtToCollateral,
    chainId: chainId as any,
    collateralAsset,
    debtAsset,
  })

  console.info('[SHARED MINT PLAN]', {
    minShares: plan.minShares.toString(),
    expectedShares: plan.expectedShares.toString(),
    expectedDebt: plan.expectedDebt.toString(),
    expectedTotalCollateral: plan.expectedTotalCollateral.toString(),
    calls: plan.calls.length,
  })

  console.info('[SHARED MINT] Simulate + write deposit')
  const { request } = await simulateLeverageRouterV2Deposit(config, {
    args: [
      token,
      plan.equityInInputAsset,
      plan.flashLoanAmount ?? plan.expectedDebt,
      plan.minShares,
      executor,
      plan.calls,
    ],
    account: account.address,
    chainId: chainId as any,
  })

  const hash = await writeLeverageRouterV2Deposit(config, request)
  console.info('[SHARED MINT RESULT]', { hash })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') {
    throw new Error(`Mint transaction reverted: ${receipt.status}`)
  }

  const sharesAfter = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account.address],
  })
  const mintedShares = sharesAfter - sharesBefore
  if (mintedShares <= 0n) {
    throw new Error('Mint produced zero shares')
  }

  const collateralBalanceAfter = await readLeverageTokenBalanceOf(config, {
    address: collateralAsset,
    args: [account.address],
  })

  return {
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    router,
    manager,
    token,
    sharesMinted: mintedShares,
    minShares: plan.minShares,
    expectedShares: plan.expectedShares,
    expectedTotalCollateral: plan.expectedTotalCollateral,
    collateralBalanceBefore,
    collateralBalanceAfter,
  }
}

async function resolveDebtToCollateralQuote(params: {
  preference: string
  useLiFi: boolean
  canUseV3: boolean
  chainId: number
  router: Address
  executor: Address
  resolvedSlippageBps: number
  publicClient: PublicClient
}): Promise<QuoteFn> {
  const {
    preference,
    useLiFi,
    canUseV3,
    chainId,
    router,
    executor,
    resolvedSlippageBps,
    publicClient,
  } = params

  const normalizedPreference = preference.trim()
  const mode = selectQuoteMode({ preference: normalizedPreference, useLiFi, canUseV3 })

  switch (mode) {
    case 'lifi': {
      console.info('[SHARED MINT] Creating LiFi quote adapter', {
        chainId,
        router,
        fromAddress: executor,
        allowBridges: 'none',
        slippageBps: resolvedSlippageBps,
      })
      return createLifiQuoteAdapter({
        chainId,
        router,
        // Align LiFi's expected sender with the actual caller (MulticallExecutor)
        fromAddress: executor,
        allowBridges: 'none',
        slippageBps: resolvedSlippageBps,
      })
    }
    case 'uniswapv3': {
      const config = ADDR.uniswapV3
      if (
        !canUseV3 ||
        !config?.quoter ||
        !config.router ||
        !config.pool ||
        typeof config.fee !== 'number'
      ) {
        throw new Error('Uniswap v3 adapter selected but configuration is incomplete')
      }
      console.info('[SHARED MINT] Creating Uniswap V3 quote adapter', {
        chainId,
        router,
        quoter: config.quoter,
        swapRouter: config.router,
        pool: config.pool,
        fee: config.fee,
        slippageBps: resolvedSlippageBps,
      })
      return createUniswapV3QuoteAdapter({
        publicClient: publicClient as unknown as UniswapV3QuoteOptions['publicClient'],
        quoter: config.quoter,
        router: config.router,
        fee: config.fee,
        recipient: router,
        poolAddress: config.pool,
        slippageBps: resolvedSlippageBps,
        ...(ADDR.weth ? { wrappedNative: ADDR.weth } : {}),
      })
    }
    default: {
      const uniswapRouter =
        (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
        ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)
      console.info('[SHARED MINT] Creating Uniswap V2 quote adapter', {
        chainId,
        router,
        uniswapRouter,
        slippageBps: resolvedSlippageBps,
      })
      return createUniswapV2QuoteAdapter({
        publicClient: publicClient as unknown as UniswapV2QuoteOptions['publicClient'],
        router: uniswapRouter,
        recipient: router,
        wrappedNative: ADDR.weth,
        slippageBps: resolvedSlippageBps,
      })
    }
  }
}

function selectQuoteMode(params: {
  preference: string
  useLiFi: boolean
  canUseV3: boolean
}): 'lifi' | 'uniswapv3' | 'uniswapv2' {
  const { preference, useLiFi, canUseV3 } = params
  const normalized = preference.toLowerCase()
  if (normalized === 'lifi') return 'lifi'
  if (normalized === 'uniswapv3' || normalized === 'v3' || normalized === 'uni-v3')
    return 'uniswapv3'
  if (normalized === 'uniswapv2' || normalized === 'v2' || normalized === 'uni-v2')
    return 'uniswapv2'

  if (useLiFi) return 'lifi'
  if (canUseV3) return 'uniswapv3'
  return 'uniswapv2'
}
