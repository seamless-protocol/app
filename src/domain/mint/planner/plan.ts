import { readContract } from '@wagmi/core'
import { type Address, encodeFunctionData, erc20Abi, formatUnits } from 'viem'
import type { Config } from 'wagmi'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Call } from '@/domain/shared/types'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { collateralRatioToLeverage } from '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'
import { lendingAdapterAbi } from '@/lib/contracts'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  readLeverageManagerV2GetLeverageTokenLendingAdapter,
  readLeverageManagerV2GetLeverageTokenState,
  readLeverageManagerV2PreviewDeposit,
  readLeverageRouterV2PreviewDeposit,
} from '@/lib/contracts/generated'
import { applySlippageFloor } from './math'

export interface MintPlan {
  minShares: bigint
  minExcessDebt: bigint
  previewShares: bigint
  previewExcessDebt: bigint
  flashLoanAmount: bigint
  equityInCollateralAsset: bigint
  calls: Array<Call>
}

export interface PlanMintParams {
  wagmiConfig: Config
  blockNumber: bigint
  leverageTokenConfig: LeverageTokenConfig
  equityInCollateralAsset: bigint
  slippageBps: number
  quoteDebtToCollateral: QuoteFn
}

export async function planMint({
  wagmiConfig,
  blockNumber,
  leverageTokenConfig,
  equityInCollateralAsset,
  slippageBps,
  quoteDebtToCollateral,
}: PlanMintParams): Promise<MintPlan> {
  if (equityInCollateralAsset <= 0n) {
    throw new Error('equityInCollateralAsset must be positive')
  }

  if (slippageBps < 0) {
    throw new Error('slippageBps cannot be negative')
  }

  const chainId = leverageTokenConfig.chainId as SupportedChainId

  const token = leverageTokenConfig.address as Address
  const collateralAsset = leverageTokenConfig.collateralAsset.address as Address
  const debtAsset = leverageTokenConfig.debtAsset.address as Address

  const { collateralRatio } = await readLeverageManagerV2GetLeverageTokenState(wagmiConfig, {
    args: [token],
    chainId,
    blockNumber,
  })

  // Initial router preview to size required debt and collateral top-up.
  const routerPreview = await readLeverageRouterV2PreviewDeposit(wagmiConfig, {
    args: [token, equityInCollateralAsset],
    chainId,
    blockNumber,
  })

  // This price is adding the NAV diff from spot on top of the share slippage
  const minShares = applySlippageFloor(routerPreview.shares, slippageBps)

  const currentLeverage = collateralRatioToLeverage(collateralRatio)

  // Leverage-adjusted slippage for the swap: scale by previewed leverage.
  // We only need this for very illiquid tokens. Maybe separate slippage for swap quote and minShares
  const quoteSlippageBps = Math.max(
    1,
    Math.floor(slippageBps / (Number(formatUnits(currentLeverage, 18)) - 1)),
  )

  const flashLoanAmount = applySlippageFloor(routerPreview.debt, slippageBps)

  // Exact-in quote using the previewed debt amount (with leverage-adjusted slippage hint)
  const debtToCollateralQuote = await quoteDebtToCollateral({
    intent: 'exactIn',
    inToken: debtAsset,
    outToken: collateralAsset,
    amountIn: flashLoanAmount,
    slippageBps: quoteSlippageBps,
  })

  const managerPreview = await readLeverageManagerV2PreviewDeposit(wagmiConfig, {
    args: [token, equityInCollateralAsset + debtToCollateralQuote.out],
    chainId,
    blockNumber,
  })

  const managerMin = await readLeverageManagerV2PreviewDeposit(wagmiConfig, {
    args: [token, equityInCollateralAsset + debtToCollateralQuote.minOut],
    chainId,
    blockNumber,
  })

  // for (let i = 0; i < 5; i += 1) {
  //   if (managerPreview.debt >= flashLoanAmount) {
  //     break
  //   }

  //   flashLoanAmount = managerPreview.debt
  //   debtToCollateralQuote = await quoteDebtToCollateral({
  //     intent: 'exactIn',
  //     inToken: debtAsset,
  //     outToken: collateralAsset,
  //     amountIn: flashLoanAmount,
  //     slippageBps: quoteSlippageBps,
  //   })
  //   totalCollateral = equityInCollateralAsset + debtToCollateralQuote.minOut
  //   managerPreview = await readLeverageManagerV2PreviewDeposit(wagmiConfig, {
  //     args: [token, totalCollateral],
  //     chainId,
  //     blockNumber,
  //   })
  // }

  if (managerPreview.debt < flashLoanAmount) {
    throw new Error(
      `Manager previewed debt ${managerPreview.debt} is less than flash loan amount ${flashLoanAmount}, likely due to slippage`,
    )
  }

  if (managerMin.debt < flashLoanAmount) {
    throw new Error(
      `Manager minimum debt ${managerMin.debt} is less than flash loan amount ${flashLoanAmount}, likely due to slippage`,
    )
  }

  if (managerMin.shares < minShares) {
    throw new Error(
      `Manager minimum shares ${managerMin.shares} are less than min shares ${minShares}, likely due to slippage`,
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

  console.log('planMint', {
    minShares,
    minExcessDebt,
    previewShares: managerPreview.shares,
    previewExcessDebt,
    flashLoanAmount,
    equityInCollateralAsset,
    calls,
  })

  return {
    minShares,
    minExcessDebt,
    previewShares: managerPreview.shares,
    previewExcessDebt,
    flashLoanAmount,
    equityInCollateralAsset,
    calls,
  }
}
