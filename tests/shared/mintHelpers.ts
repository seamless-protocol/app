import type { Address, PublicClient } from 'viem'
import { parseUnits } from 'viem'
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
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, CHAIN_ID, mode, RPC } from './env'
import { readErc20Decimals } from './erc20'
import { approveIfNeeded, topUpErc20, topUpNative } from './funding'

export type MintSetupParams = {
  account: { address: Address }
  publicClient: PublicClient
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  slippageBps?: number
  chainIdOverride?: number
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
  addresses,
}: MintSetupParams): Promise<MintOutcome> {
  const resolvedSlippageBps = Number(process.env['TEST_SLIPPAGE_BPS'] ?? slippageBps ?? 50)
  if (mode !== 'tenderly') {
    console.error('Shared mint helper requires Tenderly VNet. Configure TEST_RPC_URL.', {
      mode,
      rpc: RPC.primary,
    })
    throw new Error('TEST_RPC_URL missing or invalid for tenderly mode')
  }

  process.env['VITE_ROUTER_VERSION'] = 'v2'
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
  await topUpErc20(collateralAsset, account.address, '25')
  await approveIfNeeded(collateralAsset, router, equityInInputAsset)

  const quoteAdapterPreference = (process.env['TEST_QUOTE_ADAPTER'] ?? '').toLowerCase()
  const useLiFi = process.env['TEST_USE_LIFI'] === '1'
  const uniswapV3Config = addresses?.uniswapV3 ?? ADDR.uniswapV3
  const canUseV3 = Boolean(
    uniswapV3Config?.quoter &&
      uniswapV3Config?.router &&
      uniswapV3Config?.pool &&
      typeof uniswapV3Config?.fee === 'number',
  )

  const quoteDebtToCollateral = await resolveDebtToCollateralQuote({
    preference: quoteAdapterPreference,
    useLiFi,
    canUseV3,
    chainId,
    router,
    executor,
    resolvedSlippageBps,
    publicClient,
  })

  const sharesBefore = await readLeverageTokenBalanceOf(config, {
    address: token,
    args: [account.address],
  })

  console.info('[SHARED MINT] Orchestrating V2 mint (simulate+write)')
  const { orchestrateMint } = await import('@/domain/mint')
  const res = await orchestrateMint({
    config,
    account: account.address,
    token,
    inputAsset: collateralAsset,
    equityInInputAsset,
    slippageBps: resolvedSlippageBps,
    quoteDebtToCollateral,
    routerAddressV2: router,
    managerAddressV2: manager,
    chainId,
  })
  if (res.routerVersion !== 'v2') {
    throw new Error(`Unexpected router version: ${res.routerVersion}`)
  }

  console.info('[SHARED MINT RESULT]', { hash: res.hash })

  console.info('[SHARED MINT PLAN]', {
    minShares: res.plan.minShares.toString(),
    expectedShares: res.plan.expectedShares.toString(),
    expectedDebt: res.plan.expectedDebt.toString(),
    expectedTotalCollateral: res.plan.expectedTotalCollateral.toString(),
    calls: res.plan.calls.length,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: res.hash })
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

  return {
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    router,
    manager,
    token,
    sharesMinted: mintedShares,
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
