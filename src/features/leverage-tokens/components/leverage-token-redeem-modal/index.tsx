import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount, useConfig, useWaitForTransactionReceipt } from 'wagmi'
import { parseErc20ReceivedFromReceipt } from '@/features/leverage-tokens/utils/receipt'
import { invalidatePortfolioQueries } from '@/features/portfolio/utils/invalidation'
import { useGA, useTransactionGA } from '@/lib/config/ga4.config'
import { captureTxError } from '@/lib/observability/sentry'
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
import { invalidateLeverageTokenQueries } from '../../utils/invalidation'
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
  { id: 'userInput', label: 'User Input', progress: 33, isUserAction: true },
  { id: 'approve', label: 'Approve', progress: 67, isUserAction: true },
  { id: 'confirm', label: 'Confirm', progress: 100, isUserAction: true },
  { id: 'pending', label: 'Processing', progress: 100, isUserAction: false },
  { id: 'success', label: 'Success', progress: 100, isUserAction: false },
  { id: 'error', label: 'Error', progress: 100, isUserAction: false },
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
  const { address: hookUserAddress, isConnected, chainId: connectedChainId } = useAccount()
  const wagmiConfig = useConfig()
  const userAddress = (propUserAddress || hookUserAddress) as `0x${string}` | undefined

  // Get leverage router address for allowance check
  const contractAddresses = getContractAddresses(leverageTokenConfig.chainId)
  const leverageRouterAddress = contractAddresses.leverageRouterV2
  const leverageManagerAddress = contractAddresses.leverageManagerV2

  // Fetch leverage token fees
  const { data: fees, isLoading: isFeesLoading } = useLeverageTokenFees(
    leverageTokenAddress,
    isOpen,
  )

  // Get real wallet balance for leverage tokens
  const {
    balance: leverageTokenBalance,
    isLoading: isLeverageTokenBalanceLoading,
    refetch: refetchLeverageTokenBalance,
  } = useTokenBalance({
    tokenAddress: leverageTokenAddress,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId as SupportedChainId,
    enabled: Boolean(userAddress && isConnected && isOpen),
  })

  const { refetch: refetchCollateralTokenBalance } = useTokenBalance({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId as SupportedChainId,
    enabled: Boolean(userAddress && isConnected && isOpen),
  })

  const { refetch: refetchDebtTokenBalance } = useTokenBalance({
    tokenAddress: leverageTokenConfig.debtAsset.address,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId as SupportedChainId,
    enabled: Boolean(userAddress && isConnected && isOpen),
  })

  // Get leverage token user position (includes USD value calculation)
  const { data: positionData, isLoading: isPositionLoading } = useLeverageTokenUserPosition({
    tokenAddress: leverageTokenAddress,
    chainIdOverride: leverageTokenConfig.chainId,
    debtAssetAddress: leverageTokenConfig.debtAsset.address,
    debtAssetDecimals: leverageTokenConfig.debtAsset.decimals,
    enabled: isOpen,
  })

  const { data: userMetrics, isLoading: isUserMetricsLoading } = useLeverageTokenUserMetrics({
    tokenAddress: leverageTokenAddress,
    chainId: leverageTokenConfig.chainId,
    collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
    ...(userAddress ? { userAddress } : {}),
    enabled: isOpen,
  })

  // Get USD prices for collateral and debt assets
  const { data: usdPriceMap } = useUsdPrices({
    chainId: leverageTokenConfig.chainId,
    addresses: [leverageTokenConfig.collateralAsset.address, leverageTokenConfig.debtAsset.address],
    enabled: Boolean(
      leverageTokenConfig.collateralAsset.address &&
        leverageTokenConfig.debtAsset.address &&
        isOpen,
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
    () => [
      outputAssetOptions.collateral,
      // outputAssetOptions.debt
    ],
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

  const [selectedToken] = useState<Token>({
    symbol: leverageTokenConfig.symbol,
    name: leverageTokenConfig.name,
    balance: leverageTokenBalanceFormatted,
    price: positionData?.equityUsd || 0,
  })

  const { slippage, setSlippage, slippageBps } = useSlippage(DEFAULT_SLIPPAGE_PERCENT_DISPLAY)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>(undefined)
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

  // Mirror exec.hash only while pending to avoid reviving stale hashes on reopen
  useEffect(() => {
    if (currentStep !== 'pending') return
    const nextHash = exec.hash as `0x${string}` | undefined
    if (nextHash && nextHash !== transactionHash) setTransactionHash(nextHash)
  }, [exec.hash, transactionHash, currentStep])

  // Watch receipt for success/error transitions
  const {
    isSuccess: redeemSuccess,
    isError: redeemError,
    error: redeemReceiptError,
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
    chainId: leverageTokenConfig.chainId,
    confirmations: 1,
    query: { enabled: Boolean(transactionHash) },
  })

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
    enabled: isOpen,
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
    return planPreview.error?.message
  }, [planPreview.error?.message])

  const redeemBlockingError = quoteBlockingError || planError

  const expectedPayoutRaw = useMemo(() => {
    return planPreview.plan?.payoutAmount
  }, [planPreview.plan?.payoutAmount])

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

  // Calculate debt asset amount that will be received
  const expectedDebtAmount = useMemo(() => {
    const plan = planPreview.plan
    if (!plan || typeof plan.expectedDebtPayout !== 'bigint' || plan.expectedDebtPayout <= 0n)
      return '0'
    return formatTokenAmountFromBase(
      plan.expectedDebtPayout,
      leverageTokenConfig.debtAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [planPreview.plan, leverageTokenConfig.debtAsset.decimals])

  // Wait for receipt once we have a hash to derive actual received amount
  const receiptState = useWaitForTransactionReceipt({
    hash: (transactionHash || undefined) as `0x${string}` | undefined,
    chainId: leverageTokenConfig.chainId,
    confirmations: 1,
    query: { enabled: Boolean(transactionHash) },
  })

  // Parse actual received amount from logs for the selected output asset
  const actualReceivedAmount = useMemo(() => {
    const receipt = receiptState.data
    if (!receipt || !userAddress) return undefined
    const raw = parseErc20ReceivedFromReceipt({
      receipt,
      tokenAddress: selectedOutputAsset.address as `0x${string}`,
      userAddress: userAddress as `0x${string}`,
    })
    if (typeof raw !== 'bigint') return undefined
    const decimals =
      selectedOutputAsset.id === 'debt'
        ? leverageTokenConfig.debtAsset.decimals
        : leverageTokenConfig.collateralAsset.decimals
    return formatTokenAmountFromBase(raw, decimals, TOKEN_AMOUNT_DISPLAY_DECIMALS)
  }, [
    receiptState.data,
    userAddress,
    selectedOutputAsset.address,
    selectedOutputAsset.id,
    leverageTokenConfig.collateralAsset.decimals,
    leverageTokenConfig.debtAsset.decimals,
  ])

  // Parse actual debt amount received from logs
  const actualDebtAmount = useMemo(() => {
    const receipt = receiptState.data
    if (!receipt || !userAddress) return undefined
    const raw = parseErc20ReceivedFromReceipt({
      receipt,
      tokenAddress: leverageTokenConfig.debtAsset.address as `0x${string}`,
      userAddress: userAddress as `0x${string}`,
    })
    if (typeof raw !== 'bigint') return undefined
    return formatTokenAmountFromBase(
      raw,
      leverageTokenConfig.debtAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [
    receiptState.data,
    userAddress,
    leverageTokenConfig.debtAsset.address,
    leverageTokenConfig.debtAsset.decimals,
  ])

  const {
    isAllowanceLoading,
    needsApproval: needsApprovalFlag,
    approve: approveAction,
    isPending: isApprovingPending,
    isApproved: isApprovedFlag,
    error: approveErr,
    hash: approveHash,
  } = useApprovalFlow({
    tokenAddress: leverageTokenAddress,
    ...(userAddress ? { owner: userAddress } : {}),
    ...(leverageRouterAddress ? { spender: leverageRouterAddress } : {}),
    ...(typeof form.amountRaw !== 'undefined' ? { amountRaw: form.amountRaw } : {}),
    decimals: leverageTokenConfig.decimals,
    chainId: leverageTokenConfig.chainId,
    enabled: isOpen,
  })

  // Step configuration (static once modal is opened)
  const steps = useMemo(() => {
    const hasAmount = parseFloat(form.amount || '0') > 0

    // If no amount entered yet, always show 3 steps
    if (!hasAmount) {
      return REDEEM_STEPS
    }

    // If amount is entered and approval is already done, show 2 steps
    if (!needsApprovalFlag) {
      return [
        { id: 'userInput', label: 'User Input', progress: 50, isUserAction: true },
        { id: 'confirm', label: 'Confirm', progress: 100, isUserAction: true },
        { id: 'pending', label: 'Processing', progress: 100, isUserAction: false },
        { id: 'success', label: 'Success', progress: 100, isUserAction: false },
        { id: 'error', label: 'Error', progress: 100, isUserAction: false },
      ]
    }

    // If amount is entered and approval is needed, show 3 steps
    return REDEEM_STEPS
  }, [form.amount, needsApprovalFlag]) // Include needsApprovalFlag dependency for proper step calculation

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
    setTransactionHash(undefined)
    setError('')

    // Track funnel step: redeem modal opened
    analytics.funnelStep('redeem_leverage_token', 'modal_opened', 1)
  }, [toInput, form.setAmount, analytics])

  useEffect(() => {
    if (isOpen) resetModal()
  }, [isOpen, resetModal])

  // Handle approval side-effects in one place
  useEffect(() => {
    if (currentStep !== 'approve') return
    if (isApprovedFlag) {
      toConfirm()
      return
    }
    if (approveErr) {
      setError(approveErr?.message || 'Approval failed. Please try again.')
      toError()
    }
  }, [isApprovedFlag, approveErr, currentStep, toConfirm, toError])

  // Check if approval is needed
  const needsApproval = () => Boolean(needsApprovalFlag)

  const isPlanCalculating = Boolean(form.amountRaw) && planPreview.isLoading

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

  const handleOutputAssetChange = useCallback((asset: OutputAssetId) => {
    setSelectedOutputId(asset)
    setError('')
  }, [])

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

      // Transition UI and initiate redeem without awaiting receipt
      toPending()
      void exec.redeem(form.amountRaw)
    } catch (error) {
      // Track redeem transaction error
      const errorMessage =
        error instanceof Error ? error.message : 'Redemption failed. Please try again.'
      trackTransactionError('redeem_failed', 'leverage_token', errorMessage)

      const provider = (() => {
        const swap = leverageTokenConfig.swaps?.collateralToDebt
        if (!swap) return undefined
        if (swap.type === 'lifi') return 'lifi'
        if (swap.type === 'uniswapV2' || swap.type === 'uniswapV3') return 'uniswap'
        return undefined
      })()

      captureTxError({
        flow: 'redeem',
        chainId: leverageTokenConfig.chainId,
        ...(typeof connectedChainId === 'number' ? { connectedChainId } : {}),
        token: leverageTokenAddress,
        outputAsset: selectedOutputAsset.address,
        slippageBps,
        amountIn: form.amount,
        expectedOut: expectedAmount,
        ...(provider ? { provider } : {}),
        error,
      })

      setError(errorMessage)
      toError()
    }
  }

  // Handle execution hook errors
  useEffect(() => {
    if (exec.error && currentStep === 'pending') {
      const errorMessage = exec.error.message || 'Redemption failed. Please try again.'
      setError(errorMessage)
      toError()
    }
  }, [exec.error, currentStep, toError])

  // Drive success/error once receipt resolves
  useEffect(() => {
    if (!transactionHash) return
    if (redeemError) {
      setError(redeemReceiptError?.message || 'Redemption failed. Please try again.')
      toError()
      return
    }
    if (redeemSuccess) {
      void (async () => {
        const tokenSymbol = leverageTokenConfig.symbol
        const amount = form.amount
        const usdValue = parseFloat(form.amount) * (selectedOutputAsset.price || 0)
        trackLeverageTokenRedeemed(tokenSymbol, amount, usdValue)
        analytics.funnelStep('redeem_leverage_token', 'transaction_completed', 3)

        try {
          // Invalidate leverage-token and portfolio caches in parallel
          await Promise.all([
            invalidateLeverageTokenQueries(queryClient, {
              token: leverageTokenAddress,
              chainId: leverageTokenConfig.chainId,
              ...(userAddress ? { owner: userAddress } : {}),
              includeUser: true,
              refetchType: 'active',
            }),
            userAddress
              ? invalidatePortfolioQueries(queryClient, {
                  address: userAddress,
                  refetchType: 'active',
                  includePerformance: true,
                })
              : Promise.resolve(),
          ])

          // Refresh immediate wallet balances for UX
          refetchLeverageTokenBalance?.()
          refetchCollateralTokenBalance?.()
          refetchDebtTokenBalance?.()
        } catch {}

        // Success feedback is conveyed by the Success step UI
        toSuccess()
      })()
    }
  }, [
    transactionHash,
    redeemSuccess,
    redeemError,
    redeemReceiptError?.message,
    leverageTokenConfig.symbol,
    leverageTokenAddress,
    form.amount,
    selectedOutputAsset.price,
    refetchLeverageTokenBalance,
    refetchCollateralTokenBalance,
    refetchDebtTokenBalance,
    queryClient,
    userAddress,
    trackLeverageTokenRedeemed,
    analytics,
    toSuccess,
    toError,
    leverageTokenConfig.chainId,
  ])

  // Handle retry from error state
  const handleRetry = () => {
    toInput()
    setError('')
    setTransactionHash(undefined)
  }

  // Handle modal close
  const handleClose = () => {
    // Prevent closing while any tx is on-chain pending (approve or redeem)
    if (currentStep === 'pending') return
    if (currentStep === 'approve' && approveHash) return
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
            isBelowMinimum={isBelowMinimum()}
            expectedDebtAmount={expectedDebtAmount}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
            debtAssetPrice={debtUsdPrice}
          />
        )

      case 'approve':
        return (
          <ApproveStep
            selectedToken={selectedTokenView}
            amount={form.amount}
            isApproving={!!isApprovingPending}
            chainId={leverageTokenConfig.chainId}
            transactionHash={approveHash as `0x${string}` | undefined}
            mode={approveHash ? 'onChain' : 'awaitingWallet'}
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
            disabled={isCalculating || exec.quoteStatus !== 'ready' || !planPreview.plan}
            expectedDebtAmount={expectedDebtAmount}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
          />
        )

      case 'pending':
        return (
          <PendingStep
            amount={form.amount}
            leverageTokenConfig={{
              symbol: leverageTokenConfig.symbol,
              name: leverageTokenConfig.name,
              leverageRatio: leverageTokenConfig.leverageRatio,
              chainId: leverageTokenConfig.chainId,
            }}
            mode={transactionHash ? 'onChain' : 'awaitingWallet'}
            transactionHash={transactionHash as `0x${string}` | undefined}
            expectedDebtAmount={expectedDebtAmount}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
          />
        )

      case 'success':
        return (
          <SuccessStep
            amount={form.amount}
            expectedAmount={actualReceivedAmount ?? expectedAmount}
            selectedAsset={selectedOutputAsset.symbol}
            leverageTokenSymbol={leverageTokenConfig.symbol}
            transactionHash={transactionHash ?? ('' as unknown as `0x${string}`)}
            onClose={handleClose}
            actualDebtAmount={actualDebtAmount}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
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
      closable={!(currentStep === 'pending' || (currentStep === 'approve' && Boolean(approveHash)))}
    >
      {renderStepContent()}
    </MultiStepModal>
  )
}

// Removed unused diagnostics helper to satisfy strict TS/no-unused rules.

// Local hook: wraps token allowance + approval flow
function useApprovalFlow(params: {
  tokenAddress: `0x${string}`
  owner?: `0x${string}`
  spender?: `0x${string}`
  amountRaw?: bigint
  decimals: number
  chainId: number
  enabled: boolean
}) {
  const { tokenAddress, owner, spender, amountRaw, decimals, chainId, enabled } = params

  const { isLoading, needsApproval, amountFormatted } = useTokenAllowance({
    tokenAddress,
    ...(owner ? { owner } : {}),
    ...(spender ? { spender } : {}),
    chainId,
    enabled: Boolean(owner && spender && enabled),
    ...(typeof amountRaw !== 'undefined' ? { amountRaw } : {}),
    decimals,
  })

  const approveState = useTokenApprove({
    tokenAddress,
    ...(spender ? { spender } : {}),
    ...(amountFormatted ? { amount: amountFormatted } : {}),
    decimals,
    targetChainId: chainId,
    enabled: Boolean(spender && amountFormatted && Number(amountFormatted) > 0 && enabled),
  })

  return {
    isAllowanceLoading: isLoading,
    needsApproval,
    approve: approveState.approve,
    isPending: approveState.isPending,
    isApproved: approveState.isApproved,
    error: approveState.error,
    hash: approveState.hash,
  }
}
