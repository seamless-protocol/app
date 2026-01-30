import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { parseUsdPrice, toScaledUsd, usdToFixedString } from '@/domain/shared/prices'
import { useLeverageTokenUsdPrice } from '@/features/leverage-tokens/hooks/useLeverageTokenUsdPrice'
import { parseErc20ReceivedFromReceipt } from '@/features/leverage-tokens/utils/receipt'
import { invalidatePortfolioQueries } from '@/features/portfolio/utils/invalidation'
import { useGA, useQuotesGA, useTransactionGA } from '@/lib/config/ga4.config'
import { captureTxError } from '@/lib/observability/sentry'
import { MultiStepModal, type StepConfig } from '../../../../components/multi-step-modal'
import { getContractAddresses, type SupportedChainId } from '../../../../lib/contracts/addresses'
import { useTokenAllowance } from '../../../../lib/hooks/useTokenAllowance'
import { useTokenApprove } from '../../../../lib/hooks/useTokenApprove'
import { useTokenBalance } from '../../../../lib/hooks/useTokenBalance'
import { useUsdPrices } from '../../../../lib/prices/useUsdPrices'
import { formatTokenAmountFromBase } from '../../../../lib/utils/formatting'
import { DEFAULT_SLIPPAGE_PERCENT_DISPLAY, TOKEN_AMOUNT_DISPLAY_DECIMALS } from '../../constants'
import { useSlippage } from '../../hooks/mint/useSlippage'
import { useRedeemExecution } from '../../hooks/redeem/useRedeemExecution'
import { useRedeemForm } from '../../hooks/redeem/useRedeemForm'
import { useRedeemPlanPreview } from '../../hooks/redeem/useRedeemPlanPreview'
import { useRedeemSteps } from '../../hooks/redeem/useRedeemSteps'
import { useLeverageTokenFees } from '../../hooks/useLeverageTokenFees'
import { useLeverageTokenUserPosition } from '../../hooks/useLeverageTokenUserPosition'
import { useMinSharesGuard } from '../../hooks/useMinSharesGuard'
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
  const { trackQuoteSource } = useQuotesGA()
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
    collateralAssetAddress: leverageTokenConfig.collateralAsset.address,
    collateralAssetDecimals: leverageTokenConfig.collateralAsset.decimals,
    debtAssetAddress: leverageTokenConfig.debtAsset.address,
    debtAssetDecimals: leverageTokenConfig.debtAsset.decimals,
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

  const { data: leverageTokenUsdPrice } = useLeverageTokenUsdPrice({
    tokenAddress: leverageTokenAddress,
  })

  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: leverageTokenConfig.symbol,
    name: leverageTokenConfig.name,
    balance: leverageTokenBalanceFormatted,
    price: leverageTokenUsdPrice ? parseFloat(formatUnits(leverageTokenUsdPrice, 18)) : 0,
  })

  useEffect(() => {
    const price = leverageTokenUsdPrice ? parseFloat(formatUnits(leverageTokenUsdPrice, 18)) : 0
    if (selectedToken.price !== price) {
      setSelectedToken({
        ...selectedToken,
        price,
      })
    }
  }, [leverageTokenUsdPrice, selectedToken])

  const { slippage, setSlippage, slippageBps } = useSlippage(
    leverageTokenAddress,
    leverageTokenConfig.slippagePresets?.redeem?.default ?? DEFAULT_SLIPPAGE_PERCENT_DISPLAY,
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState('')

  // Form state and logic
  const form = useRedeemForm({
    leverageTokenDecimals: leverageTokenConfig.decimals,
    leverageTokenBalanceFormatted,
  })

  // Preview redemption (like mint modal)
  // Execution hook (like mint modal)
  const exec = useRedeemExecution({
    token: leverageTokenAddress,
    ...(userAddress ? { account: userAddress } : {}),
    chainId: leverageTokenConfig.chainId as SupportedChainId,

    ...(leverageRouterAddress ? { routerAddress: leverageRouterAddress } : {}),
    ...(leverageManagerAddress ? { managerAddress: leverageManagerAddress } : {}),
    ...(leverageTokenConfig.swaps?.collateralToDebt
      ? { swap: leverageTokenConfig.swaps.collateralToDebt }
      : {}),
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

  const planPreview = useRedeemPlanPreview({
    token: leverageTokenAddress,
    sharesToRedeem: form.amountRaw,
    slippageBps,
    chainId: leverageTokenConfig.chainId,
    enabled: isOpen,
    ...(exec.quote ? { quote: exec.quote } : {}),
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

  const expectedCollateralRaw = useMemo(() => {
    return planPreview.plan?.previewCollateralForSender
  }, [planPreview.plan?.previewCollateralForSender])

  const expectedTokens = useMemo(() => {
    if (typeof expectedCollateralRaw !== 'bigint') return '0'
    return formatTokenAmountFromBase(
      expectedCollateralRaw,
      leverageTokenConfig.collateralAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [expectedCollateralRaw, leverageTokenConfig.collateralAsset.decimals])

  const expectedExcessDebt = useMemo(() => {
    const plan = planPreview.plan
    if (!plan || typeof plan.previewExcessDebt !== 'bigint' || plan.previewExcessDebt <= 0n)
      return '0'
    return formatTokenAmountFromBase(
      plan.previewExcessDebt,
      leverageTokenConfig.debtAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [planPreview.plan, leverageTokenConfig.debtAsset.decimals])

  const minCollateral = useMemo(() => {
    const plan = planPreview.plan
    if (!plan || typeof plan.minCollateralForSender !== 'bigint') return '0'
    return formatTokenAmountFromBase(
      plan.minCollateralForSender,
      leverageTokenConfig.collateralAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [planPreview.plan, leverageTokenConfig.collateralAsset.decimals])

  const minExcessDebt = useMemo(() => {
    const plan = planPreview.plan
    if (!plan || typeof plan.minExcessDebt !== 'bigint' || plan.minExcessDebt <= 0n) return '0'
    return formatTokenAmountFromBase(
      plan.minExcessDebt,
      leverageTokenConfig.debtAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [planPreview.plan, leverageTokenConfig.debtAsset.decimals])

  const {
    expectedTokensUsdOutStr,
    expectedDebtUsdOutStr,
    expectedTotalUsdOutStr,
    minTokensUsdOutStr,
    minExcessDebtUsdOutStr,
    minTotalUsdOutStr,
  } = useMemo(() => {
    const collateralPriceScaled =
      typeof collateralUsdPrice === 'number' && collateralUsdPrice > 0
        ? parseUsdPrice(collateralUsdPrice)
        : 0n
    const debtPriceScaled =
      typeof debtUsdPrice === 'number' && debtUsdPrice > 0 ? parseUsdPrice(debtUsdPrice) : 0n
    const plan = planPreview.plan

    if (!plan || collateralPriceScaled === 0n) {
      return {
        expectedTokensUsdOutStr: '0',
        expectedDebtUsdOutStr: '0',
        expectedTotalUsdOutStr: '0',
        minTokensUsdOutStr: '0',
        minExcessDebtUsdOutStr: '0',
        minTotalUsdOutStr: '0',
      }
    }

    const expectedTokensUsdOut = toScaledUsd(
      plan.previewCollateralForSender ?? 0n,
      leverageTokenConfig.collateralAsset.decimals,
      collateralPriceScaled,
    )
    const expectedDebtUsdOut =
      debtPriceScaled === 0n
        ? 0n
        : toScaledUsd(
            plan.previewExcessDebt ?? 0n,
            leverageTokenConfig.debtAsset.decimals,
            debtPriceScaled,
          )
    const expectedTotalUsdOut = expectedTokensUsdOut + expectedDebtUsdOut

    const minTokensUsdOut = toScaledUsd(
      plan.minCollateralForSender ?? 0n,
      leverageTokenConfig.collateralAsset.decimals,
      collateralPriceScaled,
    )
    const minExcessDebtUsdOut =
      debtPriceScaled === 0n
        ? 0n
        : toScaledUsd(
            plan.minExcessDebt ?? 0n,
            leverageTokenConfig.debtAsset.decimals,
            debtPriceScaled,
          )
    const minTotalUsdOut = minTokensUsdOut + minExcessDebtUsdOut

    const formatUsd = (value: bigint) => usdToFixedString(value, 2)

    return {
      expectedTokensUsdOutStr: formatUsd(expectedTokensUsdOut),
      expectedDebtUsdOutStr: formatUsd(expectedDebtUsdOut),
      expectedTotalUsdOutStr: formatUsd(expectedTotalUsdOut),
      minTokensUsdOutStr: formatUsd(minTokensUsdOut),
      minExcessDebtUsdOutStr: formatUsd(minExcessDebtUsdOut),
      minTotalUsdOutStr: formatUsd(minTotalUsdOut),
    }
  }, [
    collateralUsdPrice,
    debtUsdPrice,
    planPreview.plan,
    leverageTokenConfig.collateralAsset.decimals,
    leverageTokenConfig.debtAsset.decimals,
  ])

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
      tokenAddress: leverageTokenConfig.collateralAsset.address as `0x${string}`,
      userAddress: userAddress as `0x${string}`,
    })
    if (typeof raw !== 'bigint') return undefined
    return formatTokenAmountFromBase(
      raw,
      leverageTokenConfig.collateralAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [
    receiptState.data,
    userAddress,
    leverageTokenConfig.collateralAsset.decimals,
    leverageTokenConfig.collateralAsset.address,
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

  // Reset modal state when modal opens (like mint modal)
  const resetModal = useCallback(() => {
    toInput()
    form.setAmount('')
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

  // Guard against quote worsening after user has acknowledged a floor
  const {
    needsReack,
    errorMessage: guardErrorMessage,
    onUserAcknowledge,
  } = useMinSharesGuard({
    currentStep,
    plan: planPreview.plan,
    getMinValue: (plan) =>
      'minCollateralForSender' in plan ? plan.minCollateralForSender : undefined,
    stepName: 'confirm',
  })

  // Check if approval is needed
  const needsApproval = () => Boolean(needsApprovalFlag)

  const quoteReady = exec.quoteStatus === 'ready' || exec.quoteStatus === 'not-required'
  const isCalculating =
    typeof form.amountRaw === 'bigint' &&
    form.amountRaw > 0n &&
    (planPreview.isLoading || exec.quoteStatus !== 'ready')

  const canProceed = () => {
    return (
      form.isAmountValid &&
      form.hasBalance &&
      !isCalculating &&
      quoteReady &&
      Boolean(planPreview.plan) &&
      typeof expectedCollateralRaw === 'bigint' &&
      parseFloat(expectedTokens || '0') > 0 &&
      isConnected &&
      !isAllowanceLoading &&
      exec.canSubmit
    )
  }

  // Check if amount is below minimum for warning
  const isBelowMinimum = () => {
    if (!form.amount || form.amount.trim() === '') return false
    return !form.minAmountOk
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
    // If quote worsened, require re-acknowledgment
    if (needsReack) {
      // User needs to acknowledge the worsened quote before proceeding
      // They can click Confirm again after reviewing, which will call onUserAcknowledge
      return
    }

    const plan = planPreview.plan
    if (!plan) {
      setError('Plan not ready. Please try again.')
      toError()
      return
    }

    if (!exec.canSubmit || typeof expectedCollateralRaw !== 'bigint') {
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
      void exec.redeem(plan)
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
        inputAsset: leverageTokenAddress,
        slippageBps,
        amountIn: form.amount ?? '',
        expectedOut: String(expectedTokens),
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

  useEffect(() => {
    if (
      planPreview.plan?.collateralToSwap &&
      planPreview.plan?.collateralToDebtQuoteAmount &&
      planPreview.plan?.quoteSourceName &&
      debtUsdPrice &&
      collateralUsdPrice
    ) {
      const amountInUSD = toScaledUsd(
        planPreview.plan?.collateralToSwap,
        leverageTokenConfig.collateralAsset.decimals,
        parseUsdPrice(collateralUsdPrice),
      )

      const amountOutUSD = toScaledUsd(
        planPreview.plan?.collateralToDebtQuoteAmount,
        leverageTokenConfig.debtAsset.decimals,
        parseUsdPrice(debtUsdPrice),
      )

      trackQuoteSource({
        event: 'best_quote_source',
        tokenIn: leverageTokenConfig.collateralAsset.address,
        tokenOut: leverageTokenConfig.debtAsset.address,
        quoteSource: planPreview.plan.quoteSourceName,
        amountIn: planPreview.plan.collateralToSwap,
        amountInUSD: Number(amountInUSD),
        amountOut: planPreview.plan.collateralToDebtQuoteAmount,
        amountOutUSD: Number(amountOutUSD),
      })
    }
  }, [
    collateralUsdPrice,
    debtUsdPrice,
    leverageTokenConfig.collateralAsset.address,
    leverageTokenConfig.collateralAsset.decimals,
    leverageTokenConfig.debtAsset.address,
    leverageTokenConfig.debtAsset.decimals,
    planPreview.plan?.collateralToDebtQuoteAmount,
    planPreview.plan?.collateralToSwap,
    planPreview.plan?.quoteSourceName,
    trackQuoteSource,
  ])

  // Guard: run success path (invalidation, tracking, toSuccess) only once per transaction hash
  const processedSuccessTxRef = useRef<Set<string>>(new Set())

  // Drive success/error once receipt resolves
  useEffect(() => {
    if (!transactionHash) return
    if (redeemError) {
      setError(redeemReceiptError?.message || 'Redemption failed. Please try again.')
      toError()
      return
    }
    if (redeemSuccess) {
      if (processedSuccessTxRef.current.has(transactionHash)) return
      processedSuccessTxRef.current.add(transactionHash)

      void (async () => {
        const tokenSymbol = leverageTokenConfig.symbol
        const amount = form.amount
        const usdValue = parseFloat(form.amount || '0') * (collateralUsdPrice || 0)
        trackLeverageTokenRedeemed(tokenSymbol, amount, usdValue)

        const swapAmountInUSD = toScaledUsd(
          planPreview.plan?.collateralToSwap || 0n,
          leverageTokenConfig.collateralAsset.decimals,
          parseUsdPrice(collateralUsdPrice || '0'),
        )
        const swapAmountOutUSD = toScaledUsd(
          planPreview.plan?.collateralToDebtQuoteAmount || 0n,
          leverageTokenConfig.debtAsset.decimals,
          parseUsdPrice(debtUsdPrice || '0'),
        )
        trackQuoteSource({
          event: 'quote_executed',
          tokenIn: leverageTokenConfig.collateralAsset.address,
          tokenOut: leverageTokenConfig.debtAsset.address,
          quoteSource: planPreview.plan?.quoteSourceName || '',
          amountIn: planPreview.plan?.collateralToSwap || 0n,
          amountInUSD: Number(swapAmountInUSD),
          amountOut: planPreview.plan?.collateralToDebtQuoteAmount || 0n,
          amountOutUSD: Number(swapAmountOutUSD),
        })

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
    analytics,
    collateralUsdPrice,
    debtUsdPrice,
    form.amount,
    leverageTokenAddress,
    leverageTokenConfig.chainId,
    leverageTokenConfig.collateralAsset.address,
    leverageTokenConfig.collateralAsset.decimals,
    leverageTokenConfig.debtAsset.address,
    leverageTokenConfig.debtAsset.decimals,
    leverageTokenConfig.symbol,
    planPreview.plan?.collateralToDebtQuoteAmount,
    planPreview.plan?.collateralToSwap,
    planPreview.plan?.quoteSourceName,
    queryClient,
    redeemError,
    redeemReceiptError?.message,
    redeemSuccess,
    refetchCollateralTokenBalance,
    refetchDebtTokenBalance,
    refetchLeverageTokenBalance,
    toError,
    toSuccess,
    trackLeverageTokenRedeemed,
    trackQuoteSource,
    transactionHash,
    userAddress,
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
    setTransactionHash(undefined)
    onClose()
  }

  const quoteSourceName = planPreview.plan?.quoteSourceName

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'userInput':
        return (
          <InputStep
            selectedToken={selectedTokenView}
            collateralAssetSymbol={leverageTokenConfig.collateralAsset.symbol}
            amount={form.amount}
            expectedTokens={expectedTokens}
            expectedExcessDebt={expectedExcessDebt}
            expectedTokensUsdOutStr={expectedTokensUsdOutStr}
            expectedDebtUsdOutStr={expectedDebtUsdOutStr}
            expectedTotalUsdOutStr={expectedTotalUsdOutStr}
            minTokens={minCollateral}
            minExcessDebt={minExcessDebt}
            minTokensUsdOutStr={minTokensUsdOutStr}
            minExcessDebtUsdOutStr={minExcessDebtUsdOutStr}
            minTotalUsdOutStr={minTotalUsdOutStr}
            onAmountChange={handleAmountChangeWithErrorClear}
            onPercentageClick={handlePercentageClickWithBalance}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            slippage={slippage}
            onSlippageChange={setSlippage}
            isLeverageTokenBalanceLoading={isLeverageTokenBalanceLoading}
            isUsdPriceLoading={isPositionLoading}
            isCalculating={isCalculating}
            isAllowanceLoading={isAllowanceLoading}
            isApproving={!!isApprovingPending}
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
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
            quoteSourceName={quoteSourceName}
          />
        )

      case 'approve':
        return (
          <ApproveStep
            selectedToken={selectedTokenView}
            amount={form.amount}
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
            expectedAmount={expectedTokens}
            selectedAsset={leverageTokenConfig.collateralAsset.symbol}
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
            expectedDebtAmount={expectedExcessDebt}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
            {...(guardErrorMessage || error ? { error: guardErrorMessage || error } : {})}
            needsReack={needsReack}
            onUserAcknowledge={onUserAcknowledge}
          />
        )

      case 'pending':
        return (
          <PendingStep
            expectedCollateralAmount={expectedTokens}
            collateralSymbol={leverageTokenConfig.collateralAsset.symbol}
            leverageTokenConfig={{
              symbol: leverageTokenConfig.symbol,
              name: leverageTokenConfig.name,
              leverageRatio: leverageTokenConfig.leverageRatio,
              chainId: leverageTokenConfig.chainId,
            }}
            mode={transactionHash ? 'onChain' : 'awaitingWallet'}
            transactionHash={transactionHash as `0x${string}` | undefined}
            expectedDebtAmount={expectedExcessDebt}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
          />
        )

      case 'success':
        return (
          <SuccessStep
            amount={form.amount}
            expectedAmount={actualReceivedAmount ?? expectedTokens}
            selectedAsset={leverageTokenConfig.collateralAsset.symbol}
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
