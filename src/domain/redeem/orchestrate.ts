/**
 * Orchestrator for leverage token redemption.
 *
 * Responsibilities:
 * - Plan V2 flow (collateral->debt swap for debt repayment) and execute
 * - Return transaction details and plan information
 */

import type { Address, Hash } from 'viem'
import type { Config } from 'wagmi'
import type { VeloraQuote } from '@/domain/shared/adapters/types'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { contractAddresses, getContractAddresses } from '@/lib/contracts/addresses'
import { executeRedeemV2 } from './exec/execute.v2'
import { executeRedeemWithVelora } from './exec/execute.velora'
import { planRedeemV2 } from './planner/plan.v2'
import type { QuoteFn } from './planner/types'
import { DEFAULT_SLIPPAGE_BPS } from './utils/constants'

// Keep parameter types simple to avoid brittle codegen coupling
type TokenArg = Address
type AccountArg = Address
type SharesToRedeemArg = bigint

// Result type for orchestrated redeems
export type OrchestrateRedeemResult = {
  hash: Hash
  plan: ReturnType<typeof planRedeemV2> extends Promise<infer P> ? P : never
}

/**
 * Orchestrates a leverage-token redeem.
 *
 * Behavior
 * - Plans the redeem (swapping collateral->debt for debt repayment), then executes.
 *
 * Requirements
 * - Requires a `quoteCollateralToDebt` function for debt repayment swaps.
 *
 * Parameters
 * @param params.config Wagmi `Config` used by generated actions for chain/account wiring.
 * @param params.account EOA that signs and submits transactions (hex address string).
 * @param params.token Leverage token tuple argument as required by generated actions.
 * @param params.sharesToRedeem Number of leverage token shares to redeem.
 * @param params.slippageBps Optional slippage tolerance in basis points (default 50 = 0.50%).
 * @param params.quoteCollateralToDebt Required. Quotes amount of debt received for a given collateral amount.
 *
 * Returns
 * - `{ hash, plan }` with transaction hash and execution plan.
 *
 * Throws
 * - If `quoteCollateralToDebt` is not provided.
 * - If redemption fails due to insufficient collateral or other constraints.
 */
export async function orchestrateRedeem(params: {
  config: Config
  account: AccountArg
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps?: number
  quoteCollateralToDebt: QuoteFn
  /** Optional overrides for V2 when using VNet/custom deployments */
  routerAddressV2?: Address
  managerAddressV2?: Address
  /** Optional override for the desired payout asset (defaults to collateral). */
  outputAsset?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<OrchestrateRedeemResult> {
  const {
    config,
    account,
    token,
    sharesToRedeem,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    quoteCollateralToDebt,
    outputAsset,
    chainId,
  } = params

  if (!quoteCollateralToDebt) throw new Error('quoteCollateralToDebt is required')

  const adapterType =
    getLeverageTokenConfig(token, chainId)?.swaps?.collateralToDebt?.type ?? 'velora'

  console.log('[redeem-orchestrate] Using swap adapter', {
    token,
    chainId,
    adapterType,
    source: getLeverageTokenConfig(token, chainId)?.swaps?.collateralToDebt?.type
      ? 'production config'
      : 'default (velora)',
  })

  const envRouterV2 = import.meta.env['VITE_ROUTER_V2_ADDRESS'] as Address | undefined
  const envManagerV2 = import.meta.env['VITE_MANAGER_V2_ADDRESS'] as Address | undefined
  // Resolve chain-scoped addresses first (respects Tenderly overrides), then allow explicit/env overrides
  const chainAddresses = getContractAddresses(chainId)
  const routerAddressV2 =
    params.routerAddressV2 ||
    (chainAddresses.leverageRouterV2 as Address | undefined) ||
    envRouterV2
  const managerAddressV2 =
    params.managerAddressV2 ||
    (chainAddresses.leverageManagerV2 as Address | undefined) ||
    envManagerV2

  const intent = getQuoteIntentForAdapter(adapterType)

  const plan = await planRedeemV2({
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    chainId,
    ...(managerAddressV2 ? { managerAddress: managerAddressV2 } : {}),
    ...(outputAsset ? { outputAsset } : {}),
    intent,
  })

  if (adapterType === 'velora') {
    const veloraAdapterAddress = chainAddresses.veloraAdapter as Address | undefined
    if (!veloraAdapterAddress) {
      throw new Error(`Velora adapter address required on chain ${chainId}`)
    }

    // Validate that the quote has veloraData (required for redeemWithVelora)
    const quote = plan.collateralToDebtQuote
    if (!('veloraData' in quote) || !quote.veloraData) {
      throw new Error(
        'Velora quote missing veloraData. ' +
          'This is required for redeemWithVelora and should always be present for exactOut (redeem) operations.',
      )
    }

    // TypeScript now knows veloraData exists
    const veloraQuote = quote as VeloraQuote & {
      veloraData: NonNullable<VeloraQuote['veloraData']>
    }

    const tx = await executeRedeemWithVelora({
      config,
      token,
      account,
      sharesToRedeem: plan.sharesToRedeem,
      minCollateralForSender: plan.minCollateralForSender,
      veloraAdapter: veloraAdapterAddress,
      augustus: veloraQuote.veloraData.augustus,
      offsets: veloraQuote.veloraData.offsets,
      swapData: veloraQuote.calldata,
      routerAddress:
        routerAddressV2 ||
        (contractAddresses[chainId]?.leverageRouterV2 as Address | undefined) ||
        (() => {
          throw new Error(`LeverageRouterV2 address required on chain ${chainId}`)
        })(),
      chainId,
    })
    return { plan, ...tx }
  }

  const tx = await executeRedeemV2({
    config,
    token,
    account,
    sharesToRedeem: plan.sharesToRedeem,
    minCollateralForSender: plan.minCollateralForSender,
    multicallExecutor:
      (getContractAddresses(chainId).multicallExecutor as Address | undefined) ||
      (typeof import.meta !== 'undefined'
        ? ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.[
            'VITE_MULTICALL_EXECUTOR_ADDRESS'
          ] as Address | undefined)
        : undefined) ||
      (typeof process !== 'undefined'
        ? (process.env['VITE_MULTICALL_EXECUTOR_ADDRESS'] as Address | undefined)
        : undefined) ||
      ((): Address => {
        throw new Error(`Multicall executor address required on chain ${chainId}`)
      })(),
    swapCalls: plan.calls,
    routerAddress:
      routerAddressV2 ||
      (contractAddresses[chainId]?.leverageRouterV2 as Address | undefined) ||
      (() => {
        throw new Error(`LeverageRouterV2 address required on chain ${chainId}`)
      })(),
    chainId,
  })
  return { plan, ...tx }
}

export const getQuoteIntentForAdapter = (adapterType: string): 'exactOut' | 'exactIn' => {
  switch (adapterType) {
    case 'velora':
      return 'exactOut'
    default:
      return 'exactIn'
  }
}
