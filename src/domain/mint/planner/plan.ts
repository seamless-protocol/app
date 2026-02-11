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

  // This price is adding the NAV diff from spot on top of the share slippage
  const minShares = applySlippageFloor(routerPreview.shares, shareSlippageBps)

  const flashLoanAmount = applySlippageFloor(routerPreview.debt, flashLoanAdjustmentBps)

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
    throw new Error(`Try increasing your Leverage Token slippage tolerance.`)
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
      `Try decreasing your swap slippage tolerance. If you cannot decrease it further, try increasing your Leverage Token slippage Tolerance`,
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
      `Try increasing your Leverage Token slippage tolerance first. You can also try decreasing your flash loan adjustment`,
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
