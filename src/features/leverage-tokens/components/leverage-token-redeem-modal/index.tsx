import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import type { OrchestrateRedeemResult } from '@/domain/redeem'
import { RouterVersion } from '@/domain/redeem/planner/types'
import { useGA, useTransactionGA } from '@/lib/config/ga4.config'
import { MultiStepModal, type StepConfig } from '../../../../components/multi-step-modal'
import { getContractAddresses, type SupportedChainId } from '../../../../lib/contracts/addresses'
import { useTokenAllowance } from '../../../../lib/hooks/useTokenAllowance'
import { useTokenApprove } from '../../../../lib/hooks/useTokenApprove'
import { useTokenBalance } from '../../../../lib/hooks/useTokenBalance'
import { useUsdPrices } from '../../../../lib/prices/useUsdPrices'
import { formatTokenAmountFromBase } from '../../../../lib/utils/formatting'
import {
  DEFAULT_SLIPPAGE_PERCENT_DISPLAY,
  MIN_REDEEM_AMOUNT_DISPLAY,
  TOKEN_AMOUNT_DISPLAY_DECIMALS,
} from '../../constants'
import { useSlippage } from '../../hooks/mint/useSlippage'
import { useRedeemExecution } from '../../hooks/redeem/useRedeemExecution'
import { useRedeemForm } from '../../hooks/redeem/useRedeemForm'
import { useRedeemPlanPreview } from '../../hooks/redeem/useRedeemPlanPreview'
import { useRedeemPreview } from '../../hooks/redeem/useRedeemPreview'
import { useRedeemSteps } from '../../hooks/redeem/useRedeemSteps'
import { useLeverageTokenEarnings } from '../../hooks/useLeverageTokenEarnings'
import { useLeverageTokenFees } from '../../hooks/useLeverageTokenFees'
import { useLeverageTokenUserMetrics } from '../../hooks/useLeverageTokenUserMetrics'
import { useLeverageTokenUserPosition } from '../../hooks/useLeverageTokenUserPosition'
import { getLeverageTokenConfig } from '../../leverageTokens.config'
import { ltKeys } from '../../utils/queryKeys'
import { ApproveStep } from '../leverage-token-mint-modal/ApproveStep'
import { ConfirmStep } from './ConfirmStep'
import { ErrorStep } from './ErrorStep'
import { InputStep } from './InputStep'
import { PendingStep } from './PendingStep'
import { SuccessStep } from './SuccessStep'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

type OutputAssetId = 'collateral' | 'debt'

interface LeverageTokenRedeemModalProps {
  isOpen: boolean
  onClose: () => void
  leverageTokenAddress: `0x${string}` // Token address to look up config
  userAddress?: `0x${string}` // Optional user address - if not provided, will use useAccount
}

// Hoisted to avoid re-creating on every render
const REDEEM_STEPS: Array<StepConfig> = [
  { id: 'userInput', label: 'User Input', progress: 17 },
  { id: 'approve', label: 'Approve', progress: 33 },
  { id: 'confirm', label: 'Confirm', progress: 50 },
  { id: 'pending', label: 'Processing', progress: 67 },
  { id: 'success', label: 'Success', progress: 100 },
  { id: 'error', label: 'Error', progress: 100 },
]

export function LeverageTokenRedeemModal({
  isOpen,
  onClose,
  leverageTokenAddress,
  userAddress: propUserAddress,
}: LeverageTokenRedeemModalProps) {
  const { trackLeverageTokenRedeemed, trackTransactionError } = useTransactionGA()
  const analytics = useGA()
  const queryClient = useQueryClient()

  // Get leverage token configuration by address
  const leverageTokenConfig = getLeverageTokenConfig(leverageTokenAddress)

  // Early return if no configuration found
  if (!leverageTokenConfig) {
    throw new Error(`No configuration found for token address: ${leverageTokenAddress}`)
  }

  // Get user account information
  const { address: hookUserAddress, isConnected } = useAccount()
  const wagmiConfig = useConfig()
  const userAddress = (propUserAddress || hookUserAddress) as `0x${string}` | undefined

  // Get leverage router address for allowance check
  const contractAddresses = getContractAddresses(leverageTokenConfig.chainId)
  const leverageRouterAddress =
    contractAddresses.leverageRouterV2 ?? contractAddresses.leverageRouter
  const leverageManagerAddress =
    contractAddresses.leverageManagerV2 ?? contractAddresses.leverageManager

  // Fetch leverage token fees
  const { data: fees, isLoading: isFeesLoading } = useLeverageTokenFees(leverageTokenAddress)

  // Get real wallet balance for leverage tokens
  const {
    balance: leverageTokenBalance,
    isLoading: isLeverageTokenBalanceLoading,
    refetch: refetchLeverageTokenBalance,
  } = useTokenBalance({
    tokenAddress: leverageTokenAddress,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(userAddress && isConnected),
  })

  const { refetch: refetchCollateralTokenBalance } = useTokenBalance({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(userAddress && isConnected),
  })

  const { refetch: refetchDebtTokenBalance } = useTokenBalance({
    tokenAddress: leverageTokenConfig.debtAsset.address,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(userAddress && isConnected),
  })

  // Get leverage token user position (includes USD value calculation)
  const { data: positionData, isLoading: isPositionLoading } = useLeverageTokenUserPosition({
    tokenAddress: leverageTokenAddress,
    chainIdOverride: leverageTokenConfig.chainId,
    debtAssetAddress: leverageTokenConfig.debtAsset.address,
    debtAssetDecimals: leverageTokenConfig.debtAsset.decimals,
  })

  const { data: userMetrics, isLoading: isUserMetricsLoading } = useLeverageTokenUserMetrics({
    tokenAddress: leverageTokenAddress,
    chainId: leverageTokenConfig.chainId,
    collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
    ...(userAddress ? { userAddress } : {}),
  })

  // Get USD prices for collateral and debt assets
  const { data: usdPriceMap } = useUsdPrices({
    chainId: leverageTokenConfig.chainId,
    addresses: [leverageTokenConfig.collateralAsset.address, leverageTokenConfig.debtAsset.address],
    enabled: Boolean(
      leverageTokenConfig.collateralAsset.address && leverageTokenConfig.debtAsset.address,
    ),
  })

  const collateralUsdPrice =
    usdPriceMap?.[leverageTokenConfig.collateralAsset.address.toLowerCase()]
  const debtUsdPrice = usdPriceMap?.[leverageTokenConfig.debtAsset.address.toLowerCase()]

  const outputAssetOptions = useMemo(
    () => ({
      collateral: {
        id: 'collateral' as const,
        symbol: leverageTokenConfig.collateralAsset.symbol,
        name: leverageTokenConfig.collateralAsset.name,
        address: leverageTokenConfig.collateralAsset.address,
        decimals: leverageTokenConfig.collateralAsset.decimals,
        price: collateralUsdPrice || 0,
      },
      debt: {
        id: 'debt' as const,
        symbol: leverageTokenConfig.debtAsset.symbol,
        name: leverageTokenConfig.debtAsset.name,
        address: leverageTokenConfig.debtAsset.address,
        decimals: leverageTokenConfig.debtAsset.decimals,
        price: debtUsdPrice || 0,
      },
    }),
    [
      collateralUsdPrice,
      debtUsdPrice,
      leverageTokenConfig.collateralAsset.address,
      leverageTokenConfig.collateralAsset.decimals,
      leverageTokenConfig.collateralAsset.name,
      leverageTokenConfig.collateralAsset.symbol,
      leverageTokenConfig.debtAsset.address,
      leverageTokenConfig.debtAsset.decimals,
      leverageTokenConfig.debtAsset.name,
      leverageTokenConfig.debtAsset.symbol,
    ],
  )

  const availableAssets = useMemo(
    () => [outputAssetOptions.collateral, outputAssetOptions.debt],
    [outputAssetOptions],
  )

  // Format balances for display
  const leverageTokenBalanceFormatted = leverageTokenBalance
    ? formatUnits(leverageTokenBalance, leverageTokenConfig.decimals)
    : '0'

  const {
    step: currentStep,
    toInput,
    toApprove,
    toConfirm,
    toPending,
    toSuccess,
    toError,
  } = useRedeemSteps('userInput')

  // Step configuration (static)
  const steps = REDEEM_STEPS

  const [selectedToken] = useState<Token>({
    symbol: leverageTokenConfig.symbol,
    name: leverageTokenConfig.name,
    balance: leverageTokenBalanceFormatted,
    price: positionData?.equityUsd || 0,
  })

  const { slippage, setSlippage, slippageBps } = useSlippage(DEFAULT_SLIPPAGE_PERCENT_DISPLAY)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  const [selectedOutputId, setSelectedOutputId] = useState<OutputAssetId>('collateral')
  const selectedOutputAsset = outputAssetOptions[selectedOutputId]

  // Form state and logic
  const form = useRedeemForm({
    leverageTokenDecimals: leverageTokenConfig.decimals,
    leverageTokenBalanceFormatted,
  })

  // Preview redemption (like mint modal)
  const preview = useRedeemPreview({
    config: wagmiConfig,
    token: leverageTokenAddress,
    sharesToRedeem: form.amountRaw,
    chainId: leverageTokenConfig.chainId,
  })

  // Execution hook (like mint modal)
  const exec = useRedeemExecution({
    token: leverageTokenAddress,
    ...(userAddress ? { account: userAddress } : {}),
    slippageBps,
    chainId: leverageTokenConfig.chainId as SupportedChainId,

    ...(leverageRouterAddress ? { routerAddress: leverageRouterAddress } : {}),
    ...(leverageManagerAddress ? { managerAddress: leverageManagerAddress } : {}),
    ...(leverageTokenConfig.swaps?.collateralToDebt
      ? { swap: leverageTokenConfig.swaps.collateralToDebt }
      : {}),
    outputAsset: selectedOutputAsset.address,
  })

  const disabledOutputAssets = useMemo(() => {
    const disabled: Array<OutputAssetId> = []
    if (exec.routerVersion !== RouterVersion.V2) {
      disabled.push('debt')
    }
    return disabled
  }, [exec.routerVersion])

  const collateralSwapConfig = leverageTokenConfig.swaps?.collateralToDebt

  const swapConfigKey = useMemo(() => {
    if (!collateralSwapConfig) return 'none'
    switch (collateralSwapConfig.type) {
      case 'lifi':
        return `lifi:${collateralSwapConfig.allowBridges ?? 'default'}:${collateralSwapConfig.order ?? 'CHEAPEST'}`
      case 'uniswapV2':
        return `uniswapV2:${collateralSwapConfig.router}`
      case 'uniswapV3':
        return `uniswapV3:${collateralSwapConfig.poolKey}`
      default:
        return 'unknown'
    }
  }, [collateralSwapConfig])

  const planPreview = useRedeemPlanPreview({
    config: wagmiConfig,
    token: leverageTokenAddress,
    sharesToRedeem: form.amountRaw,
    slippageBps,
    chainId: leverageTokenConfig.chainId,
    routerVersion: exec.routerVersion,
    ...(exec.quote ? { quote: exec.quote } : {}),
    ...(leverageManagerAddress ? { managerAddress: leverageManagerAddress } : {}),
    ...(swapConfigKey ? { swapKey: swapConfigKey } : {}),
    outputAsset: selectedOutputAsset.address,
  })

  const quoteBlockingError = useMemo(() => {
    switch (exec.quoteStatus) {
      case 'not-required':
      case 'ready':
        return undefined
      case 'missing-config':
        return 'Swap configuration missing for this leverage token. Redeeming via router v2 is unavailable.'
      case 'missing-router':
        return 'Leverage router address is unavailable; confirm contract addresses are configured for this chain.'
      case 'missing-client':
        return 'Unable to access the RPC client for quote generation. Check your connection and try again.'
      case 'missing-chain-config':
        return 'Uniswap pool configuration is missing for this chain. Please update the app config to enable redeeming.'
      case 'error':
        return (
          exec.quoteError?.message ?? 'Failed to initialize swap quote. Please retry in a moment.'
        )
      default:
        return undefined
    }
  }, [exec.quoteError?.message, exec.quoteStatus])

  const planError = useMemo(() => {
    if (exec.routerVersion !== RouterVersion.V2) return undefined
    return planPreview.error?.message
  }, [exec.routerVersion, planPreview.error?.message])

  const redeemBlockingError = quoteBlockingError || planError

  const expectedPayoutRaw = useMemo(() => {
    if (exec.routerVersion === RouterVersion.V2) {
      return planPreview.plan?.payoutAmount
    }
    return selectedOutputId === 'debt' ? preview.data?.debt : preview.data?.collateral
  }, [
    exec.routerVersion,
    planPreview.plan?.payoutAmount,
    preview.data?.collateral,
    preview.data?.debt,
    selectedOutputId,
  ])

  const expectedAmount = useMemo(() => {
    if (typeof expectedPayoutRaw !== 'bigint') return '0'
    const decimals =
      selectedOutputAsset.id === 'debt'
        ? leverageTokenConfig.debtAsset.decimals
        : leverageTokenConfig.collateralAsset.decimals
    return formatTokenAmountFromBase(expectedPayoutRaw, decimals, TOKEN_AMOUNT_DISPLAY_DECIMALS)
  }, [
    expectedPayoutRaw,
    selectedOutputAsset.id,
    leverageTokenConfig.collateralAsset.decimals,
    leverageTokenConfig.debtAsset.decimals,
  ])

  const {
    isAllowanceLoading,
    needsApproval: needsApprovalFlag,
    approve: approveAction,
    isPending: isApprovingPending,
    isApproved: isApprovedFlag,
    error: approveErr,
  } = useApprovalFlow({
    tokenAddress: leverageTokenAddress,
    ...(userAddress ? { owner: userAddress } : {}),
    ...(leverageRouterAddress ? { spender: leverageRouterAddress } : {}),
    ...(typeof form.amountRaw !== 'undefined' ? { amountRaw: form.amountRaw } : {}),
    decimals: leverageTokenConfig.decimals,
    chainId: leverageTokenConfig.chainId,
  })

  // View model for selected token: inject live balance/price data
  const selectedTokenView = useMemo(() => {
    return {
      ...selectedToken,
      balance: leverageTokenBalanceFormatted,
      price: positionData?.equityUsd || 0,
    }
  }, [selectedToken, leverageTokenBalanceFormatted, positionData?.equityUsd])

  const earnings = useLeverageTokenEarnings({
    ...(userMetrics ? { metrics: userMetrics } : {}),
    ...(typeof positionData?.equityInDebt === 'bigint'
      ? { equityDebt: positionData.equityInDebt }
      : {}),
    ...(typeof positionData?.equityUsd === 'number' ? { equityUsd: positionData.equityUsd } : {}),
    collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
    debtDecimals: leverageTokenConfig.debtAsset.decimals,
    ...(typeof collateralUsdPrice === 'number' ? { collateralPrice: collateralUsdPrice } : {}),
    ...(typeof debtUsdPrice === 'number' ? { debtPrice: debtUsdPrice } : {}),
  })

  // Reset modal state when modal opens (like mint modal)
  const resetModal = useCallback(() => {
    toInput()
    form.setAmount('')
    setSelectedOutputId('collateral')
    setTransactionHash('')
    setError('')

    // Track funnel step: redeem modal opened
    analytics.funnelStep('redeem_leverage_token', 'modal_opened', 1)
  }, [toInput, form.setAmount, analytics])

  useEffect(() => {
    if (isOpen) resetModal()
  }, [isOpen, resetModal])

  useEffect(() => {
    if (exec.routerVersion !== RouterVersion.V2 && selectedOutputId === 'debt') {
      setSelectedOutputId('collateral')
    }
  }, [exec.routerVersion, selectedOutputId])

  // Handle approval side-effects in one place
  useEffect(() => {
    if (currentStep !== 'approve') return
    if (isApprovedFlag) {
      toast.success('Token approval confirmed', {
        description: `${selectedToken.symbol} spending approved`,
      })
      toConfirm()
      return
    }
    if (approveErr) {
      setError(approveErr?.message || 'Approval failed. Please try again.')
      toError()
    }
  }, [isApprovedFlag, approveErr, currentStep, selectedToken.symbol, toConfirm, toError])

  // Check if approval is needed
  const needsApproval = () => Boolean(needsApprovalFlag)

  const isPlanCalculating =
    exec.routerVersion === RouterVersion.V2 && Boolean(form.amountRaw) && planPreview.isLoading

  const isCalculating = preview.isLoading || isPlanCalculating

  const canProceed = () => {
    return (
      form.isAmountValid &&
      form.hasBalance &&
      !isCalculating &&
      typeof expectedPayoutRaw === 'bigint' &&
      isConnected &&
      !isAllowanceLoading &&
      exec.canSubmit
    )
  }

  // Check if amount is below minimum for warning
  const isBelowMinimum = () => {
    const amount = parseFloat(form.amount || '0')
    const minAmount = parseFloat(MIN_REDEEM_AMOUNT_DISPLAY)
    return amount > 0 && amount < minAmount
  }

  // Handle amount input changes (with error clearing)
  const handleAmountChangeWithErrorClear = (value: string) => {
    form.onAmountChange(value)
    setError('')
  }

  // Handle percentage shortcuts (with token balance)
  const handlePercentageClickWithBalance = (percentage: number) => {
    form.onPercent(percentage, selectedTokenView.balance)
  }

  const handleOutputAssetChange = useCallback(
    (asset: OutputAssetId) => {
      if (asset === 'debt' && exec.routerVersion !== RouterVersion.V2) {
        return
      }
      setSelectedOutputId(asset)
      setError('')
    },
    [exec.routerVersion],
  )

  // Handle approval step
  const handleApprove = async () => {
    // Skip approval if not needed
    if (!needsApproval()) {
      toConfirm()
      return
    }

    toApprove()
    try {
      approveAction()
    } catch (_error) {
      setError('Approval failed. Please try again.')
      toError()
    }
  }

  // Handle redemption confirmation
  const handleConfirm = async () => {
    if (!form.amountRaw) return
    if (!exec.canSubmit || typeof expectedPayoutRaw !== 'bigint') {
      setError(
        redeemBlockingError || 'Redeem configuration is not ready. Please try again shortly.',
      )
      toError()
      return
    }

    try {
      // Track funnel step: redeem transaction initiated
      analytics.funnelStep('redeem_leverage_token', 'transaction_initiated', 2)

      toPending()
      const result = await exec.redeem(form.amountRaw)
      setTransactionHash(result.hash)

      // Track successful redeem transaction
      const tokenSymbol = leverageTokenConfig.symbol
      const amount = form.amount
      const usdValue = parseFloat(form.amount) * (selectedOutputAsset.price || 0)
      trackLeverageTokenRedeemed(tokenSymbol, amount, usdValue)

      // Track funnel step: redeem transaction completed
      analytics.funnelStep('redeem_leverage_token', 'transaction_completed', 3)

      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        logRedeemDiagnostics({
          result,
          collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
          debtDecimals: leverageTokenConfig.debtAsset.decimals,
          payoutAsset: selectedOutputAsset.address,
          ...(typeof preview.data?.collateral === 'bigint'
            ? { previewCollateral: preview.data.collateral }
            : {}),
          ...(typeof preview.data?.debt === 'bigint' ? { previewDebt: preview.data.debt } : {}),
        })
      }

      const toastAmount =
        result.routerVersion === 'v2'
          ? formatTokenAmountFromBase(
              result.plan.payoutAmount,
              result.plan.payoutAsset.toLowerCase() ===
                leverageTokenConfig.debtAsset.address.toLowerCase()
                ? leverageTokenConfig.debtAsset.decimals
                : leverageTokenConfig.collateralAsset.decimals,
              TOKEN_AMOUNT_DISPLAY_DECIMALS,
            )
          : expectedAmount

      toast.success('Redemption successful!', {
        description: `${form.amount} ${leverageTokenConfig.symbol} redeemed for ${toastAmount} ${selectedOutputAsset.symbol}`,
      })

      refetchLeverageTokenBalance?.()
      refetchCollateralTokenBalance?.()
      refetchDebtTokenBalance?.()
      queryClient.invalidateQueries({ queryKey: ltKeys.token(leverageTokenAddress) })
      if (userAddress) {
        queryClient.invalidateQueries({ queryKey: ltKeys.user(leverageTokenAddress, userAddress) })
      }

      toSuccess()
    } catch (error) {
      // Track redeem transaction error
      const errorMessage =
        error instanceof Error ? error.message : 'Redemption failed. Please try again.'
      trackTransactionError('redeem_failed', 'leverage_token', errorMessage)

      setError(errorMessage)
      toError()
    }
  }

  // Handle retry from error state
  const handleRetry = () => {
    toInput()
    setError('')
  }

  // Handle modal close
  const handleClose = () => {
    if (currentStep === 'pending') return // Prevent closing during transaction
    onClose()
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'userInput':
        return (
          <InputStep
            selectedToken={selectedTokenView}
            availableAssets={availableAssets}
            amount={form.amount}
            onAmountChange={handleAmountChangeWithErrorClear}
            onPercentageClick={handlePercentageClickWithBalance}
            selectedAssetId={selectedOutputId}
            selectedAssetSymbol={selectedOutputAsset.symbol}
            onAssetChange={handleOutputAssetChange}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            slippage={slippage}
            onSlippageChange={setSlippage}
            isLeverageTokenBalanceLoading={isLeverageTokenBalanceLoading}
            isUsdPriceLoading={isPositionLoading}
            isCalculating={isCalculating}
            isAllowanceLoading={isAllowanceLoading}
            isApproving={!!isApprovingPending}
            expectedAmount={expectedAmount}
            selectedAssetPrice={selectedOutputAsset.price}
            earnings={earnings}
            debtSymbol={leverageTokenConfig.debtAsset.symbol}
            collateralSymbol={leverageTokenConfig.collateralAsset.symbol}
            isUserMetricsLoading={isUserMetricsLoading}
            canProceed={canProceed()}
            needsApproval={needsApproval()}
            isConnected={isConnected}
            onApprove={handleApprove}
            error={error || redeemBlockingError}
            leverageTokenConfig={leverageTokenConfig}
            redemptionFee={fees?.redeemTreasuryFee}
            isRedemptionFeeLoading={isFeesLoading}
            redeemTokenFee={fees?.redeemTokenFee}
            isRedeemTokenFeeLoading={isFeesLoading}
            disabledAssets={disabledOutputAssets}
            isBelowMinimum={isBelowMinimum()}
          />
        )

      case 'approve':
        return (
          <ApproveStep
            selectedToken={selectedTokenView}
            amount={form.amount}
            isApproving={!!isApprovingPending}
          />
        )

      case 'confirm':
        return (
          <ConfirmStep
            selectedToken={selectedTokenView}
            amount={form.amount}
            expectedAmount={expectedAmount}
            selectedAsset={selectedOutputAsset.symbol}
            leverageTokenConfig={{
              symbol: leverageTokenConfig.symbol,
              name: leverageTokenConfig.name,
              leverageRatio: leverageTokenConfig.leverageRatio,
              chainId: leverageTokenConfig.chainId,
            }}
            redemptionFee={fees?.redeemTreasuryFee}
            isRedemptionFeeLoading={isFeesLoading}
            onConfirm={handleConfirm}
          />
        )

      case 'pending':
        return <PendingStep amount={form.amount} leverageTokenConfig={leverageTokenConfig} />

      case 'success':
        return (
          <SuccessStep
            amount={form.amount}
            expectedAmount={expectedAmount}
            selectedAsset={selectedOutputAsset.symbol}
            leverageTokenSymbol={leverageTokenConfig.symbol}
            transactionHash={transactionHash}
            onClose={handleClose}
          />
        )

      case 'error':
        return <ErrorStep error={error} onRetry={handleRetry} onClose={handleClose} />

      default:
        return null
    }
  }

  return (
    <MultiStepModal
      isOpen={isOpen}
      onClose={handleClose}
      title={currentStep === 'success' ? 'Redemption Status' : 'Redeem Leverage Token'}
      description={
        currentStep === 'success'
          ? 'Your redemption request has been processed successfully.'
          : 'Redeem your leverage tokens back to the underlying assets.'
      }
      currentStep={currentStep}
      steps={steps}
      className="max-w-lg border border-[var(--divider-line)] bg-[var(--surface-card)]"
    >
      {renderStepContent()}
    </MultiStepModal>
  )
}

function logRedeemDiagnostics(params: {
  result: OrchestrateRedeemResult
  previewCollateral?: bigint
  previewDebt?: bigint
  collateralDecimals: number
  debtDecimals: number
  payoutAsset?: string
}) {
  const { result, previewCollateral, previewDebt, collateralDecimals, debtDecimals, payoutAsset } =
    params

  const formatValue = (value: bigint | undefined, decimals: number) =>
    typeof value === 'bigint' ? formatUnits(value, decimals) : 'n/a'

  if (result.routerVersion === 'v2') {
    const gross = formatValue(
      previewCollateral ?? result.plan.expectedTotalCollateral,
      collateralDecimals,
    )
    const debt = formatValue(previewDebt ?? result.plan.expectedDebt, debtDecimals)
    const net = formatValue(result.plan.expectedCollateral, collateralDecimals)
    const swapInput = formatValue(
      result.plan.expectedTotalCollateral - result.plan.expectedCollateral,
      collateralDecimals,
    )
    const payoutDecimals =
      result.plan.payoutAsset.toLowerCase() === result.plan.debtAsset.toLowerCase()
        ? debtDecimals
        : collateralDecimals
    const payout = formatValue(result.plan.payoutAmount, payoutDecimals)
    const debtPayout = formatValue(result.plan.expectedDebtPayout, debtDecimals)

    console.groupCollapsed('[redeem][v2] diagnostics')
    console.table({
      grossCollateral: gross,
      debtToRepay: debt,
      swapInput,
      netCollateral: net,
      slippageBps: result.plan.slippageBps,
      payoutAsset: result.plan.payoutAsset,
      requestedPayoutAsset: payoutAsset ?? 'n/a',
      payoutAmount: payout,
      debtPayout,
    })
    console.groupEnd()
    return
  }

  console.groupCollapsed('[redeem][v1] diagnostics')
  console.table({
    previewCollateral: formatValue(previewCollateral, collateralDecimals),
    previewDebt: formatValue(previewDebt, debtDecimals),
  })
  console.groupEnd()
}

// Local hook: wraps token allowance + approval flow
function useApprovalFlow(params: {
  tokenAddress: `0x${string}`
  owner?: `0x${string}`
  spender?: `0x${string}`
  amountRaw?: bigint
  decimals: number
  chainId: number
}) {
  const { tokenAddress, owner, spender, amountRaw, decimals, chainId } = params

  const { isLoading, needsApproval, amountFormatted } = useTokenAllowance({
    tokenAddress,
    ...(owner ? { owner } : {}),
    ...(spender ? { spender } : {}),
    chainId,
    enabled: Boolean(owner && spender),
    ...(typeof amountRaw !== 'undefined' ? { amountRaw } : {}),
    decimals,
  })

  const approveState = useTokenApprove({
    tokenAddress,
    ...(spender ? { spender } : {}),
    ...(amountFormatted ? { amount: amountFormatted } : {}),
    decimals,
    targetChainId: chainId,
    enabled: Boolean(spender && amountFormatted && Number(amountFormatted) > 0),
  })

  return {
    isAllowanceLoading: isLoading,
    needsApproval,
    approve: approveState.approve,
    isPending: approveState.isPending,
    isApproved: approveState.isApproved,
    error: approveState.error,
  }
}
