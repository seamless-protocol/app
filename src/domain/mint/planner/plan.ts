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

  const previewDepositInitial = await publicClient.readContract({
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
    debtToCollateralQuoteInitial.out > 0n
      ? (flashLoanAmountInitial * exchangeRateScale) / debtToCollateralQuoteInitial.out
      : 0n
  const collateralToDebtRateFromPreviewDeposit =
    (previewDepositInitial.debt * exchangeRateScale) /
    (equityInCollateralAsset + debtToCollateralQuoteInitial.out)

  const flashLoanAmountUnadjusted = solveFlashLoanAmountFromImpliedRates({
    equityInCollateralAsset,
    collateralToDebtRateFromQuote,
    collateralToDebtRateFromPreviewDeposit,
    exchangeRateScale,
    flashLoanAmountInitial,
    previewDepositDebtInitialSample: previewDepositInitial.debt,
  })
  const flashLoanAmount = applySlippageFloor(flashLoanAmountUnadjusted, flashLoanAdjustmentBps)

  const debtToCollateralQuote = await quoteDebtToCollateral({
    intent: 'exactIn',
    inToken: debtAsset,
    outToken: collateralAsset,
    amountIn: flashLoanAmount,
    slippageBps: swapSlippageBps,
  })

  if (debtToCollateralQuote.out <= 0n) {
    captureMintPlanError({
      errorString: `Debt to collateral quote output ${debtToCollateralQuote.out} is less than or equal to 0`,
      shareSlippageBps,
      swapSlippageBps,
      flashLoanAdjustmentBps,
      routerPreview,
      debtToCollateralQuote,
      flashLoanAmount,
    })
    throw new Error(
      `Insufficient DEX liquidity to mint. Try minting a smaller amount of Leverage Tokens.`,
    )
  }

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
  collateralToDebtRateFromPreviewDeposit,
  exchangeRateScale,
  flashLoanAmountInitial,
  previewDepositDebtInitialSample,
}: {
  equityInCollateralAsset: bigint
  collateralToDebtRateFromQuote: bigint
  collateralToDebtRateFromPreviewDeposit: bigint
  exchangeRateScale: bigint
  flashLoanAmountInitial: bigint
  previewDepositDebtInitialSample: bigint
}): bigint {
  if (collateralToDebtRateFromQuote <= collateralToDebtRateFromPreviewDeposit) {
    // Under the linearized model, quoteRate <= previewDepositDebtRate means there is no
    // finite upper bound for debt >= flash-loan. Use a sampled point that is
    // already observed via exact quote and previewDeposit.
    return previewDepositDebtInitialSample >= flashLoanAmountInitial
      ? flashLoanAmountInitial
      : previewDepositDebtInitialSample
  }

  // Derive a bound for flash-loan debt F such that predicted previewDeposit debt covers repayment.
  //
  // Definitions (all in base units):
  // - F = flash-loan debt amount (debt units)
  // - E = equityInCollateralAsset (collateral units)
  // - q = collateralToDebtRateFromQuote / exchangeRateScale
  //       where q is debt-per-collateral from the quote sample
  // - m = collateralToDebtRateFromPreviewDeposit / exchangeRateScale
  //       where m is debt-per-collateral from the previewDeposit sample
  //
  // Approximate relationships:
  // - quoteOutCollateral(F) ~= F / q
  // - previewDepositDebt(F) ~= m * (E + quoteOutCollateral(F))
  //                   ~= m * (E + F / q)
  //
  // Safety condition we want:
  // - previewDepositDebt(F) >= F
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
    collateralToDebtRateFromPreviewDeposit * collateralToDebtRateFromQuote * equityInCollateralAsset
  const denominator =
    exchangeRateScale * (collateralToDebtRateFromQuote - collateralToDebtRateFromPreviewDeposit)

  const maxFlashLoanSatisfyingInequality = denominator > 0n ? numerator / denominator : 0n

  // Defensive fallback: if the inequality-derived bound is zero/negative
  // (e.g. due to rounding or degenerate sampled rates), use the router
  // preview baseline rather than returning an invalid flash-loan amount.
  // This value may still work depending on what the flash loan adjustment parameter is set to.
  if (maxFlashLoanSatisfyingInequality <= 0n) {
    return flashLoanAmountInitial
  }

  return maxFlashLoanSatisfyingInequality
}
