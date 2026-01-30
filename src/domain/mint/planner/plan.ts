import { type Address, encodeFunctionData, erc20Abi, formatUnits, type PublicClient } from 'viem'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { Call } from '@/domain/shared/types'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { collateralRatioToLeverage } from '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'
import { leverageManagerV2Abi } from '@/lib/contracts/abis/leverageManagerV2'
import { leverageRouterV2Abi } from '@/lib/contracts/abis/leverageRouterV2'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { getContractAddresses } from '@/lib/contracts/addresses'
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
  slippageBps: number
  quoteDebtToCollateral: QuoteFn
}

export async function planMint({
  publicClient,
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

  console.debug(`planMint slippageBps: ${slippageBps}`)

  const chainId = leverageTokenConfig.chainId as SupportedChainId

  const token = leverageTokenConfig.address as Address
  const collateralAsset = leverageTokenConfig.collateralAsset.address as Address
  const debtAsset = leverageTokenConfig.debtAsset.address as Address

  const [{ collateralRatio }, routerPreview] = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      {
        address: getContractAddresses(chainId).leverageManagerV2 as Address,
        abi: leverageManagerV2Abi,
        functionName: 'getLeverageTokenState',
        args: [token],
      },
      {
        address: getContractAddresses(chainId).leverageRouterV2 as Address,
        abi: leverageRouterV2Abi,
        functionName: 'previewDeposit',
        args: [token, equityInCollateralAsset],
      },
    ],
  })

  // This price is adding the NAV diff from spot on top of the share slippage
  const minShares = applySlippageFloor(routerPreview.shares, slippageBps)

  const currentLeverage = collateralRatioToLeverage(collateralRatio)

  // Leverage-adjusted slippage for the swap: scale by previewed leverage.
  const quoteSlippageBps = Math.max(
    1,
    Math.floor((slippageBps * 0.5) / (Number(formatUnits(currentLeverage, 18)) - 1)),
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
    throw new Error(
      `Manager previewed debt ${managerPreview.debt} is less than flash loan amount ${flashLoanAmount}. Try increasing your slippage tolerance`,
    )
  }

  if (managerMin.debt < flashLoanAmount) {
    throw new Error(
      `Manager minimum debt ${managerMin.debt} is less than flash loan amount ${flashLoanAmount}. Try increasing your slippage tolerance`,
    )
  }

  if (managerMin.shares < minShares) {
    throw new Error(
      `Manager minimum shares ${managerMin.shares} are less than min shares ${minShares}. Try increasing your slippage tolerance`,
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
