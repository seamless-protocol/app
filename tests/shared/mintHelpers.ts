import type { Address, PublicClient } from 'viem'
import { parseUnits } from 'viem'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'
import { createDebtToCollateralQuote } from '@/domain/mint/utils/createDebtToCollateralQuote'
import type { QuoteFn } from '@/domain/shared/adapters/types'
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

  const quoteDebtToCollateral = await resolveDebtToCollateralQuote({
    token,
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

  console.info('[SHARED MINT] Planning V2 mint')
  const plan = await planMintV2({
    config,
    token,
    inputAsset: collateralAsset,
    equityInInputAsset,
    slippageBps: resolvedSlippageBps,
    quoteDebtToCollateral,
    chainId: chainId as any,
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
  token: Address
  chainId: number
  router: Address
  executor: Address
  resolvedSlippageBps: number
  publicClient: PublicClient
}): Promise<QuoteFn> {
  const { token, chainId, router, executor, resolvedSlippageBps, publicClient } = params

  // Try to use the token's configured swap settings from leverageTokens.config.ts
  const tokenConfig = getLeverageTokenConfig(token, chainId)
  const swapConfig = tokenConfig?.swaps?.debtToCollateral

  if (swapConfig) {
    console.info('[SHARED MINT] Using token swap configuration', {
      token,
      chainId,
      swapType: swapConfig.type,
    })

    // Use domain layer's createDebtToCollateralQuote which handles all adapter types
    const { quote } = createDebtToCollateralQuote({
      chainId,
      routerAddress: router,
      swap: swapConfig,
      slippageBps: resolvedSlippageBps,
      getPublicClient: (cid: number) => (cid === chainId ? publicClient : undefined),
      fromAddress: executor,
    })

    return quote
  }

  // Fallback: if no token config found, throw error with helpful message
  throw new Error(
    `No swap configuration found for token ${token} on chain ${chainId}. ` +
      'Add token to leverageTokens.config.ts or provide swap config explicitly.',
  )
}
