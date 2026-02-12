import { type Address, encodeFunctionData, erc20Abi, type PublicClient } from 'viem'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Call } from '@/domain/shared/types'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { leverageManagerV2Abi } from '@/lib/contracts/abis/leverageManagerV2'
import { leverageRouterV2Abi } from '@/lib/contracts/abis/leverageRouterV2'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { captureMintPlanError } from '@/lib/observability/sentry'
import { applySlippageFloor } from './math'

export interface MintPlan {
  minShares: bigint
  minExcessDebt: bigint
  previewShares: bigint
  previewExcessDebt: bigint
  flashLoanAmount: bigint
  flashLoanToCollateralQuoteAmount: bigint
  equityInCollateralAsset: bigint
  calls: Array<Call>
  quoteSourceName: string | undefined
  quoteSourceId: string | undefined
}

export interface PlanMintParams {
  publicClient: PublicClient
  leverageTokenConfig: LeverageTokenConfig
  equityInCollateralAsset: bigint
  shareSlippageBps: number
  swapSlippageBps: number
  flashLoanAdjustmentBps: number
  quoteDebtToCollateral: QuoteFn
}

export async function planMint({
  publicClient,
  leverageTokenConfig,
  equityInCollateralAsset,
  shareSlippageBps,
  swapSlippageBps,
  flashLoanAdjustmentBps,
  quoteDebtToCollateral,
}: PlanMintParams): Promise<MintPlan> {
  if (equityInCollateralAsset <= 0n) {
    throw new Error('equityInCollateralAsset must be positive')
  }

  if (shareSlippageBps < 0) {
    throw new Error('Leverage Token slippage tolerance cannot be less than 0')
  }

  if (swapSlippageBps < 1) {
    throw new Error('Swap slippage cannot be less than 0.01%')
  }

  console.debug(`planMint shareSlippageBps: ${shareSlippageBps}`)
  console.debug(`planMint swapSlippageBps: ${swapSlippageBps}`)
  console.debug(`planMint flashLoanAdjustmentBps: ${flashLoanAdjustmentBps}`)

  const chainId = leverageTokenConfig.chainId as SupportedChainId

  const token = leverageTokenConfig.address as Address
  const collateralAsset = leverageTokenConfig.collateralAsset.address as Address
  const debtAsset = leverageTokenConfig.debtAsset.address as Address

  const routerPreview = await publicClient.readContract({
    address: getContractAddresses(chainId).leverageRouterV2 as Address,
    abi: leverageRouterV2Abi,
    functionName: 'previewDeposit',
    args: [token, equityInCollateralAsset],
  })

  const flashLoanAmountInitial = routerPreview.debt
  const debtToCollateralQuoteInitial = await quoteDebtToCollateral({
    intent: 'exactIn',
    inToken: debtAsset,
    outToken: collateralAsset,
    amountIn: flashLoanAmountInitial,
    slippageBps: swapSlippageBps,
  })

  const managerPreviewInitial = await publicClient.readContract({
    address: getContractAddresses(chainId).leverageManagerV2 as Address,
    abi: leverageManagerV2Abi,
    functionName: 'previewDeposit',
    args: [token, equityInCollateralAsset + debtToCollateralQuoteInitial.out],
  })

  const exchangeRateScale =
    10n **
    BigInt(
      Math.max(
        leverageTokenConfig.debtAsset.decimals,
        leverageTokenConfig.collateralAsset.decimals,
      ),
    )
  const collateralToDebtRateFromQuote =
    (flashLoanAmountInitial * exchangeRateScale) / debtToCollateralQuoteInitial.out
  const collateralToDebtRateFromManager =
    (managerPreviewInitial.debt * exchangeRateScale) /
    (equityInCollateralAsset + debtToCollateralQuoteInitial.out)

  const flashLoanAmountUnadjusted = solveFlashLoanAmountFromImpliedRates({
    equityInCollateralAsset,
    collateralToDebtRateFromQuote,
    collateralToDebtRateFromManager,
    exchangeRateScale,
    flashLoanAmountInitial,
    managerDebtAtInitialSample: managerPreviewInitial.debt,
  })
  const flashLoanAmount = applySlippageFloor(flashLoanAmountUnadjusted, flashLoanAdjustmentBps)

  const debtToCollateralQuote = await quoteDebtToCollateral({
    intent: 'exactIn',
    inToken: debtAsset,
    outToken: collateralAsset,
    amountIn: flashLoanAmount,
    slippageBps: swapSlippageBps,
  })

  const [managerPreview, managerMin] = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      {
        address: getContractAddresses(chainId).leverageManagerV2 as Address,
        abi: leverageManagerV2Abi,
        functionName: 'previewDeposit',
        args: [token, equityInCollateralAsset + debtToCollateralQuote.out],
      },
      {
        address: getContractAddresses(chainId).leverageManagerV2 as Address,
        abi: leverageManagerV2Abi,
        functionName: 'previewDeposit',
        args: [token, equityInCollateralAsset + debtToCollateralQuote.minOut],
      },
    ],
  })

  const minShares = applySlippageFloor(managerPreview.shares, shareSlippageBps)

  if (managerPreview.debt < flashLoanAmount) {
    captureMintPlanError({
      errorString: `Manager previewed debt ${managerPreview.debt} is less than flash loan amount ${flashLoanAmount}.`,
      shareSlippageBps,
      swapSlippageBps,
      flashLoanAdjustmentBps,
      routerPreview,
      debtToCollateralQuote,
      managerPreview,
      managerMin,
      flashLoanAmount,
    })
    throw new Error('Flash loan too large. Try increasing the flash loan adjustment parameter.')
  }

  if (managerMin.debt < flashLoanAmount) {
    captureMintPlanError({
      errorString: `Manager minimum debt ${managerMin.debt} is less than flash loan amount ${flashLoanAmount}.`,
      shareSlippageBps,
      swapSlippageBps,
      flashLoanAdjustmentBps,
      routerPreview,
      debtToCollateralQuote,
      managerPreview,
      managerMin,
      flashLoanAmount,
    })
    throw new Error(
      'Flash loan too large. Try decreasing the swap slippage tolerance or increasing the flash loan adjustment parameter.',
    )
  }

  if (managerMin.shares < minShares) {
    captureMintPlanError({
      errorString: `Manager minimum shares ${managerMin.shares} are less than min shares ${minShares}.`,
      shareSlippageBps,
      swapSlippageBps,
      flashLoanAdjustmentBps,
      routerPreview,
      debtToCollateralQuote,
      managerPreview,
      managerMin,
      flashLoanAmount,
    })
    throw new Error(
      `Mint preview resulted in less Leverage Tokens than the allowed slippage tolerance. Try reducing the swap slippage tolerance, or increasing the Leverage Token slippage tolerance.`,
    )
  }

  const previewExcessDebt = managerPreview.debt - flashLoanAmount
  const minExcessDebt = managerMin.debt - flashLoanAmount

  const approvalCall: Call | undefined =
    flashLoanAmount > 0n
      ? {
          target: debtAsset,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [debtToCollateralQuote.approvalTarget, flashLoanAmount],
          }),
          value: 0n,
        }
      : undefined

  const calls: Array<Call> = []
  if (approvalCall) calls.push(approvalCall)
  calls.push(...debtToCollateralQuote.calls)

  return {
    minShares,
    minExcessDebt,
    previewShares: managerPreview.shares,
    previewExcessDebt,
    flashLoanAmount,
    flashLoanToCollateralQuoteAmount: debtToCollateralQuote.out,
    equityInCollateralAsset,
    calls,
    quoteSourceName: debtToCollateralQuote.quoteSourceName,
    quoteSourceId: debtToCollateralQuote.quoteSourceId,
  }
}

export function solveFlashLoanAmountFromImpliedRates({
  equityInCollateralAsset,
  collateralToDebtRateFromQuote,
  collateralToDebtRateFromManager,
  exchangeRateScale,
  flashLoanAmountInitial,
  managerDebtAtInitialSample,
}: {
  equityInCollateralAsset: bigint
  collateralToDebtRateFromQuote: bigint
  collateralToDebtRateFromManager: bigint
  exchangeRateScale: bigint
  flashLoanAmountInitial: bigint
  managerDebtAtInitialSample: bigint
}): bigint {
  if (collateralToDebtRateFromQuote <= collateralToDebtRateFromManager) {
    // Under the linearized model, quoteRate <= managerRate means there is no
    // finite upper bound for debt >= flash-loan. Use the sampled point that is
    // already observed via exact quote + manager preview.
    return managerDebtAtInitialSample >= flashLoanAmountInitial
      ? flashLoanAmountInitial
      : managerDebtAtInitialSample
  }

  // Derive a bound for flash-loan debt F such that predicted manager debt covers repayment.
  //
  // Definitions (all in base units):
  // - F = flash-loan debt amount (debt units)
  // - E = equityInCollateralAsset (collateral units)
  // - q = collateralToDebtRateFromQuote / exchangeRateScale
  //       where q is debt-per-collateral from the quote sample
  // - m = collateralToDebtRateFromManager / exchangeRateScale
  //       where m is debt-per-collateral from the manager sample
  //
  // Approximate relationships:
  // - quoteOutCollateral(F) ~= F / q
  // - managerDebt(F) ~= m * (E + quoteOutCollateral(F))
  //                   ~= m * (E + F / q)
  //
  // Safety condition we want:
  // - managerDebt(F) >= F
  //
  // Solve:
  //   m * (E + F / q) >= F
  //   mE + (m/q)F >= F
  //   mE >= F * (1 - m/q)
  //   F <= mE / (1 - m/q)
  //   F <= (m * q * E) / (q - m)
  //
  // Since rates are scaled integers:
  // - mScaled = m * exchangeRateScale
  // - qScaled = q * exchangeRateScale
  // Substituting and simplifying gives:
  //   F <= (mScaled * qScaled * E) / (exchangeRateScale * (qScaled - mScaled))
  const numerator =
    collateralToDebtRateFromManager * collateralToDebtRateFromQuote * equityInCollateralAsset
  const denominator =
    exchangeRateScale * (collateralToDebtRateFromQuote - collateralToDebtRateFromManager)

  const maxFlashLoanSatisfyingInequality = numerator / denominator

  // Defensive fallback: if the inequality-derived bound is zero/negative
  // (e.g. due to rounding or degenerate sampled rates), use the router
  // preview baseline rather than returning an invalid flash-loan amount.
  // This value may still work depending on what the flash loan adjustment parameter is set to.
  if (maxFlashLoanSatisfyingInequality <= 0n) {
    return flashLoanAmountInitial
  }

  return maxFlashLoanSatisfyingInequality
}
