import type { Address, PublicClient } from 'viem'
import { parseUnits } from 'viem'
import { createLifiQuoteAdapter } from '@/domain/shared/adapters/lifi'
import {
  createUniswapV2QuoteAdapter,
  type UniswapV2QuoteOptions,
} from '@/domain/shared/adapters/uniswapV2'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageTokenBalanceOf,
} from '@/lib/contracts/generated'
import { ADDR, mode, RPC } from './env'
import { readErc20Decimals } from './erc20'
import { approveIfNeeded, topUpErc20, topUpNative } from './funding'

export type MintSetupParams = {
  account: { address: Address }
  publicClient: PublicClient
  config: Parameters<typeof readLeverageTokenBalanceOf>[0]
  slippageBps?: number
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
}: MintSetupParams): Promise<MintOutcome> {
  if (mode !== 'tenderly') {
    console.error('Shared mint helper requires Tenderly VNet. Configure TEST_RPC_URL.', {
      mode,
      rpc: RPC.primary,
    })
    throw new Error('TEST_RPC_URL missing or invalid for tenderly mode')
  }

  // Only set router version if not already set
  if (!process.env['VITE_ROUTER_VERSION']) {
    process.env['VITE_ROUTER_VERSION'] = 'v2'
  }
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

  console.info('[SHARED MINT] Using public RPC', { url: RPC.primary })
  const chainId = tokenConfig.chainId
  console.info('[SHARED MINT] Chain ID', { chainId })

  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    address: manager,
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    address: manager,
    args: [token],
  })
  console.info('[SHARED MINT] Token assets', { collateralAsset, debtAsset })

  const decimals = await readErc20Decimals(config, collateralAsset)
  const equityInInputAsset = parseUnits('10', decimals) // Reasonable amount to create healthy leverage position
  console.info('[SHARED MINT] Funding + approving collateral', {
    collateralAsset,
    equityInInputAsset: equityInInputAsset.toString(),
  })
  await topUpNative(account.address, '1')
  await topUpErc20(collateralAsset, account.address, '10000000') // 10M weETH to ensure sufficient collateral for redeem
  await approveIfNeeded(collateralAsset, router, equityInInputAsset)

  const useLiFi = process.env['TEST_USE_LIFI'] === '1'
  const quoteDebtToCollateral = useLiFi
    ? (() => {
        console.info('[SHARED MINT] Creating LiFi quote adapter', {
          chainId,
          router,
          fromAddress: executor,
          allowBridges: 'none',
        })
        return createLifiQuoteAdapter({
          chainId,
          router,
          fromAddress: executor,
          allowBridges: 'none',
        })
      })()
    : (() => {
        const uniswapRouter =
          (process.env['TEST_UNISWAP_V2_ROUTER'] as Address | undefined) ??
          ('0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address)
        console.info('[SHARED MINT] Creating Uniswap V2 quote adapter', {
          chainId,
          router,
          uniswapRouter,
        })
        return createUniswapV2QuoteAdapter({
          publicClient: publicClient as unknown as UniswapV2QuoteOptions['publicClient'],
          router: uniswapRouter,
          recipient: router,
          wrappedNative: ADDR.weth,
        })
      })()

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
    slippageBps,
    quoteDebtToCollateral,
    routerAddressV2: router,
    managerAddressV2: manager,
  })
  if (res.routerVersion !== 'v2') {
    throw new Error(`Unexpected router version: ${res.routerVersion}`)
  }

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
