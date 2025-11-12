import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import {
  useAccount,
  useConfig,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseUsdPrice, toScaledUsd, usdToFixedString } from '@/domain/shared/prices'
import {
  parseErc20ReceivedFromReceipt,
  parseMintedSharesFromReceipt,
} from '@/features/leverage-tokens/utils/receipt'
import { invalidatePortfolioQueries } from '@/features/portfolio/utils/invalidation'
import { useGA, useTransactionGA } from '@/lib/config/ga4.config'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { captureTxError } from '@/lib/observability/sentry'
import { MultiStepModal, type StepConfig } from '../../../../components/multi-step-modal'
import { getContractAddresses } from '../../../../lib/contracts/addresses'
import { useTokenAllowance } from '../../../../lib/hooks/useTokenAllowance'
import { useTokenApprove } from '../../../../lib/hooks/useTokenApprove'
import { useTokenBalance } from '../../../../lib/hooks/useTokenBalance'
import { useUsdPrices } from '../../../../lib/prices/useUsdPrices'
import { formatTokenAmountFromBase } from '../../../../lib/utils/formatting'
import {
  DEFAULT_SLIPPAGE_PERCENT_DISPLAY,
  MIN_MINT_AMOUNT_DISPLAY,
  TOKEN_AMOUNT_DISPLAY_DECIMALS,
} from '../../constants'
import { useDebtToCollateralQuote } from '../../hooks/mint/useDebtToCollateralQuote'
import { useMintForm } from '../../hooks/mint/useMintForm'
import { useMintPlanPreview } from '../../hooks/mint/useMintPlanPreview'
import { useMintSteps } from '../../hooks/mint/useMintSteps'
import { useMintWrite } from '../../hooks/mint/useMintWrite'
import { useSlippage } from '../../hooks/mint/useSlippage'
import { useLeverageTokenFees } from '../../hooks/useLeverageTokenFees'
import { useLeverageTokenManagerAssets } from '../../hooks/useLeverageTokenManagerAssets'
import { useLeverageTokenState } from '../../hooks/useLeverageTokenState'
import { getLeverageTokenConfig } from '../../leverageTokens.config'
import { invalidateLeverageTokenQueries } from '../../utils/invalidation'
import { ApproveStep } from './ApproveStep'
import { ConfirmStep } from './ConfirmStep'
import { ErrorStep } from './ErrorStep'
// Import step components
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

interface LeverageTokenMintModalProps {
  isOpen: boolean
  onClose: () => void
  leverageTokenAddress: `0x${string}` // Token address to look up config
  userAddress?: `0x${string}` // Optional user address - if not provided, will use useAccount
}

// Hoisted to avoid re-creating on every render
const MINT_STEPS: Array<StepConfig> = [
  { id: 'userInput', label: 'User Input', progress: 33, isUserAction: true },
  { id: 'approve', label: 'Approve', progress: 67, isUserAction: true },
  { id: 'confirm', label: 'Confirm', progress: 100, isUserAction: true },
  { id: 'pending', label: 'Processing', progress: 100, isUserAction: false },
  { id: 'success', label: 'Success', progress: 100, isUserAction: false },
  { id: 'error', label: 'Error', progress: 100, isUserAction: false },
]

export function LeverageTokenMintModal({
  isOpen,
  onClose,
  leverageTokenAddress,
  userAddress: propUserAddress,
}: LeverageTokenMintModalProps) {
  const { trackLeverageTokenMinted, trackTransactionError } = useTransactionGA()
  const analytics = useGA()

  // Get leverage token configuration by address
  const leverageTokenConfig = getLeverageTokenConfig(leverageTokenAddress)

  // Early return if no configuration found
  if (!leverageTokenConfig) {
    throw new Error(`No configuration found for token address: ${leverageTokenAddress}`)
  }

  // Get user account information
  const { address: hookUserAddress, isConnected, chainId: connectedChainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const wagmiConfig = useConfig()
  const publicClient = usePublicClient({ chainId: leverageTokenConfig.chainId })
  const queryClient = useQueryClient()
  const userAddress = propUserAddress || hookUserAddress

  // Get leverage router address for allowance check
  const contractAddresses = getContractAddresses(leverageTokenConfig.chainId)
  const leverageRouterAddress = contractAddresses.leverageRouterV2

  const {
    collateralAsset,
    debtAsset,
    isLoading: assetsLoading,
  } = useLeverageTokenManagerAssets({
    token: leverageTokenAddress,
    chainId: leverageTokenConfig.chainId as SupportedChainId,
    enabled: isOpen,
  })

  // Fetch leverage token fees
  const { data: fees, isLoading: isFeesLoading } = useLeverageTokenFees(
    leverageTokenAddress,
    isOpen,
  )

  // Fetch leverage token state (current supply)
  const { data: leverageTokenState } = useLeverageTokenState(
    leverageTokenAddress,
    leverageTokenConfig.chainId,
    isOpen,
  )

  // Get real wallet balance for collateral asset
  const {
    balance: collateralBalance,
    isLoading: isCollateralBalanceLoading,
    refetch: refetchCollateralBalance,
  } = useTokenBalance({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId as SupportedChainId,
    enabled: Boolean(userAddress && isConnected && isOpen),
  })

  // Track user's leverage token balance for immediate holdings refresh after mint
  const { refetch: refetchLeverageTokenBalance } = useTokenBalance({
    tokenAddress: leverageTokenAddress,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId as SupportedChainId,
    enabled: Boolean(userAddress && isConnected && isOpen),
  })

  // Get USD prices for collateral and debt assets
  const { data: usdPriceMap, isLoading: isUsdPriceLoading } = useUsdPrices({
    chainId: leverageTokenConfig.chainId,
    addresses: [leverageTokenConfig.collateralAsset.address, leverageTokenConfig.debtAsset.address],
    enabled: Boolean(
      leverageTokenConfig.collateralAsset.address &&
        leverageTokenConfig.debtAsset.address &&
        isOpen,
    ),
  })

  // USD prices
  const collateralUsdPrice =
    usdPriceMap?.[leverageTokenConfig.collateralAsset.address.toLowerCase()]
  const debtUsdPrice = usdPriceMap?.[leverageTokenConfig.debtAsset.address.toLowerCase()]

  // Format balance for display
  const collateralBalanceFormatted = collateralBalance
    ? formatUnits(collateralBalance, leverageTokenConfig.collateralAsset.decimals)
    : '0'

  const {
    step: currentStep,
    toInput,
    toApprove,
    toConfirm,
    toPending,
    toSuccess,
    toError,
  } = useMintSteps('userInput')

  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: leverageTokenConfig.collateralAsset.symbol,
    name: leverageTokenConfig.collateralAsset.name,
    balance: collateralBalanceFormatted,
    price: collateralUsdPrice || 0, // Real-time USD price from CoinGecko
  })
  const { slippage, setSlippage, slippageBps } = useSlippage(DEFAULT_SLIPPAGE_PERCENT_DISPLAY)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showBreakdown, _] = useState(false)
  // Derive expected tokens from preview data (no local state needed)
  const [transactionHash, setTransactionHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState('')

  // Hooks: form, preview, allowance, execution
  const currentSupplyFormatted = leverageTokenState
    ? Number(formatUnits(leverageTokenState.totalSupply, leverageTokenConfig.decimals))
    : undefined

  const form = useMintForm({
    decimals: leverageTokenConfig.collateralAsset.decimals,
    walletBalanceFormatted: collateralBalanceFormatted,
    minAmountFormatted: MIN_MINT_AMOUNT_DISPLAY,
    ...(leverageTokenState && {
      currentSupply: currentSupplyFormatted,
    }),
    ...(leverageTokenConfig.supplyCap && {
      supplyCap: leverageTokenConfig.supplyCap,
    }),
  })

  const quoteDebtToCollateral = useDebtToCollateralQuote({
    chainId: leverageTokenConfig.chainId,
    ...(leverageRouterAddress ? { routerAddress: leverageRouterAddress } : {}),
    ...(leverageTokenConfig.swaps?.debtToCollateral
      ? { swap: leverageTokenConfig.swaps.debtToCollateral }
      : {}),
    slippageBps,
    requiresQuote: Boolean(leverageTokenConfig.swaps?.debtToCollateral),
    ...(contractAddresses.multicallExecutor
      ? { fromAddress: contractAddresses.multicallExecutor }
      : {}),
  })

  const planPreview = useMintPlanPreview({
    config: wagmiConfig,
    token: leverageTokenAddress,
    inputAsset: leverageTokenConfig.collateralAsset.address,
    equityInCollateralAsset: form.amountRaw,
    slippageBps,
    chainId: leverageTokenConfig.chainId,
    collateralAsset,
    debtAsset,
    ...(quoteDebtToCollateral.quote ? { quote: quoteDebtToCollateral.quote } : {}),
    collateralUsdPrice,
    debtUsdPrice,
    collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
    debtDecimals: leverageTokenConfig.debtAsset.decimals,
    enabled: isOpen,
  })

  // USD estimates now derived inside useMintPlanPreview
  const expectedUsdOutScaled = planPreview.expectedUsdOutScaled
  const guaranteedUsdOutScaled = planPreview.guaranteedUsdOutScaled
  const expectedUsdOutStr = planPreview.expectedUsdOutStr
  const guaranteedUsdOutStr = planPreview.guaranteedUsdOutStr

  // Track receipt (declared before expectedTokens; effect declared below after expectedTokens)
  const receiptState = useWaitForTransactionReceipt({
    hash: transactionHash,
    chainId: leverageTokenConfig.chainId,
    confirmations: 1,
    query: { enabled: Boolean(transactionHash) },
  })

  // Build route/safety breakdown (best-effort)
  const breakdown = useMemo(() => {
    const plan = planPreview.plan
    const rows: Array<{ label: string; value: string }> = []
    if (!plan) return rows
    try {
      // Leverage multiple ~ expectedDebt / equityIn
      if (typeof plan.expectedDebt === 'bigint' && typeof plan.equityInInputAsset === 'bigint') {
        const eq = Number(
          formatUnits(plan.equityInInputAsset, leverageTokenConfig.collateralAsset.decimals),
        )
        const debt = Number(formatUnits(plan.expectedDebt, leverageTokenConfig.debtAsset.decimals))
        if (eq > 0 && Number.isFinite(eq) && Number.isFinite(debt)) {
          rows.push({ label: 'Leverage multiple', value: `×${(debt / eq).toFixed(2)}` })
        }
      }
      // Aggregator slippage (from UI setting)
      rows.push({ label: 'Aggregator slippage', value: `${slippageBps} bps` })
      // Planner margin (epsilon)
      const eps = leverageTokenConfig.planner?.epsilonBps ?? 10
      rows.push({ label: 'Planner safety', value: `${eps} bps` })
      // Route provider
      const provider = leverageTokenConfig.swaps?.debtToCollateral?.type ?? '—'
      rows.push({ label: 'Route provider', value: String(provider) })
      // MinOut vs Expected out (route floor)
      if (typeof plan.swapExpectedOut === 'bigint' && typeof plan.swapMinOut === 'bigint') {
        const exp = Number(
          formatUnits(plan.swapExpectedOut, leverageTokenConfig.collateralAsset.decimals),
        )
        const min = Number(
          formatUnits(plan.swapMinOut, leverageTokenConfig.collateralAsset.decimals),
        )
        if (exp > 0 && Number.isFinite(exp) && Number.isFinite(min)) {
          const bps = Math.max(0, Math.round((1 - min / exp) * 10000))
          rows.push({ label: 'Route minOut gap', value: `${bps} bps` })
        }
      }
      return rows
    } catch {
      return rows
    }
  }, [
    planPreview.plan,
    leverageTokenConfig.collateralAsset.decimals,
    leverageTokenConfig.debtAsset.decimals,
    leverageTokenConfig.planner?.epsilonBps,
    leverageTokenConfig.swaps?.debtToCollateral,
    slippageBps,
  ])

  // Parse actual debt amount received from logs
  const actualExcessDebtAmountReceived = useMemo(() => {
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

  // Impact warning on stable pairs (LST/WETH) if estimated or guaranteed falls below thresholds
  const impactWarning: string | undefined = useMemo(() => {
    if (!expectedUsdOutScaled || !guaranteedUsdOutScaled) return undefined
    const symbol = leverageTokenConfig.collateralAsset.symbol?.toLowerCase?.()
    const debtSym = leverageTokenConfig.debtAsset.symbol?.toLowerCase?.()
    const stable = (symbol === 'weeth' || symbol === 'wsteth') && debtSym === 'weth'
    if (!stable) return undefined
    if (!form.amountRaw || form.amountRaw <= 0n || !collateralUsdPrice) return undefined
    const priceScaled = parseUsdPrice(collateralUsdPrice)
    const inputUsdScaled = toScaledUsd(
      form.amountRaw,
      leverageTokenConfig.collateralAsset.decimals,
      priceScaled,
    )
    if (inputUsdScaled <= 0n) return undefined
    const expRatioBps = Number((expectedUsdOutScaled * 10000n) / inputUsdScaled)
    const floorRatioBps = Number((guaranteedUsdOutScaled * 10000n) / inputUsdScaled)
    if (floorRatioBps < 9500)
      return 'Guaranteed outcome is more than 5% below input value for a stable pair.'
    if (expRatioBps < 9700)
      return 'Estimated outcome is more than 3% below input value for a stable pair.'
    return undefined
  }, [
    leverageTokenConfig.collateralAsset.symbol,
    leverageTokenConfig.debtAsset.symbol,
    form.amountRaw,
    collateralUsdPrice,
    expectedUsdOutScaled,
    guaranteedUsdOutScaled,
    leverageTokenConfig.collateralAsset.decimals,
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
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    ...(userAddress ? { owner: userAddress } : {}),
    ...(leverageRouterAddress ? { spender: leverageRouterAddress } : {}),
    ...(typeof form.amountRaw !== 'undefined' ? { amountRaw: form.amountRaw } : {}),
    decimals: leverageTokenConfig.collateralAsset.decimals,
    chainId: leverageTokenConfig.chainId,
    enabled: isOpen,
  })

  const mintWrite = useMintWrite(
    userAddress && planPreview.plan
      ? {
          chainId: leverageTokenConfig.chainId as SupportedChainId,
          token: leverageTokenAddress,
          account: userAddress,
          plan: {
            inputAsset: planPreview.plan.inputAsset,
            equityInInputAsset: planPreview.plan.equityInInputAsset,
            minShares: planPreview.plan.minShares,
            calls: planPreview.plan.calls,
            expectedTotalCollateral: planPreview.plan.expectedTotalCollateral,
            expectedDebt: planPreview.plan.expectedDebt,
            flashLoanAmount: planPreview.plan.flashLoanAmount,
          },
        }
      : undefined,
  )

  // Step configuration (static once modal is opened)
  const steps = useMemo(() => {
    const hasAmount = parseFloat(form.amount || '0') > 0

    // If no amount entered yet, always show 3 steps
    if (!hasAmount) {
      return MINT_STEPS
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
    return MINT_STEPS
  }, [form.amount, needsApprovalFlag]) // Include needsApprovalFlag dependency for proper step calculation

  // Reset state when modal opens
  const resetModal = useCallback(() => {
    toInput()
    form.setAmount('')
    setError('')
    setTransactionHash(undefined)

    // Track funnel step: mint modal opened
    analytics.funnelStep('mint_leverage_token', 'modal_opened', 1)
  }, [toInput, form.setAmount, analytics])

  useEffect(() => {
    if (isOpen) resetModal()
  }, [isOpen, resetModal])

  // View model for selected token: inject live balance/price when it's the collateral asset
  const selectedTokenView = useMemo(() => {
    if (selectedToken.symbol !== leverageTokenConfig.collateralAsset.symbol) return selectedToken
    return {
      ...selectedToken,
      balance: collateralBalanceFormatted,
      price: collateralUsdPrice || 0,
    }
  }, [
    selectedToken,
    leverageTokenConfig.collateralAsset.symbol,
    collateralBalanceFormatted,
    collateralUsdPrice,
  ])

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

  const expectedTokens = useMemo(() => {
    const shares = planPreview.plan?.expectedShares
    return formatTokenAmountFromBase(
      shares,
      leverageTokenConfig.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [planPreview.plan?.expectedShares, leverageTokenConfig.decimals])

  // Parse actual minted shares from receipt logs (typed util) and format for display
  const actualMintedTokens = useMemo(() => {
    const receipt = receiptState.data
    if (!receipt || !userAddress) return undefined
    const shares = parseMintedSharesFromReceipt({
      receipt,
      leverageTokenAddress,
      userAddress: userAddress as `0x${string}`,
    })
    if (typeof shares === 'bigint') {
      return formatTokenAmountFromBase(
        shares,
        leverageTokenConfig.decimals,
        TOKEN_AMOUNT_DISPLAY_DECIMALS,
      )
    }
    return undefined
  }, [receiptState.data, userAddress, leverageTokenAddress, leverageTokenConfig.decimals])

  // Calculate debt asset amount that will be received
  const expectedExcessDebtAmount = useMemo(() => {
    const plan = planPreview.plan
    if (!plan || typeof plan.expectedExcessDebt !== 'bigint' || plan.expectedExcessDebt <= 0n)
      return '0'
    return formatTokenAmountFromBase(
      plan.expectedExcessDebt,
      leverageTokenConfig.debtAsset.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [planPreview.plan, leverageTokenConfig.debtAsset.decimals])

  // Receipt effect (after expectedTokens to satisfy dependency ordering)
  useEffect(() => {
    if (!transactionHash) return
    if (receiptState.isError) {
      const errMsg = receiptState.error?.message || 'Transaction failed or timed out.'
      setError(errMsg)
      toError()
      return
    }
    if (receiptState.isSuccess) {
      void (async () => {
        // Ensure a paint so on-chain pending text can flash on instant receipts
        try {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        } catch {}
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

          refetchCollateralBalance?.()
          refetchLeverageTokenBalance?.()
        } catch {}
        const tokenSymbol = leverageTokenConfig.symbol
        const amount = form.amount
        const usdValue = (parseFloat(form.amount || '0') || 0) * (selectedToken.price || 0)
        trackLeverageTokenMinted(tokenSymbol, amount, usdValue)
        analytics.funnelStep('mint_leverage_token', 'transaction_completed', 3)
        // Success feedback is conveyed by the Success step UI
        toSuccess()
      })()
    }
  }, [
    transactionHash,
    receiptState.isSuccess,
    receiptState.isError,
    receiptState.error,
    leverageTokenConfig.chainId,
    leverageTokenAddress,
    userAddress,
    form.amount,
    selectedToken.price,
    refetchCollateralBalance,
    refetchLeverageTokenBalance,
    trackLeverageTokenMinted,
    analytics,
    toSuccess,
    toError,
    leverageTokenConfig.symbol,
    queryClient,
  ])

  // Available tokens for minting (only collateral asset for now)
  const availableTokens: Array<Token> = [
    {
      symbol: leverageTokenConfig.collateralAsset.symbol,
      name: leverageTokenConfig.collateralAsset.name,
      balance: collateralBalanceFormatted,
      price: collateralUsdPrice || 0, // Real-time USD price from CoinGecko
    },
  ]

  // Handle amount input changes
  const handleAmountChange = (value: string) => {
    form.onAmountChange(value)
    setError('')
  }

  // Handle percentage shortcuts
  const handlePercentageClick = (percentage: number) => {
    form.onPercent(percentage)
  }

  // Check if approval is needed
  const needsApproval = () => Boolean(needsApprovalFlag)

  // Validate mint
  const canProceed = () => {
    const requiresQuote = Boolean(leverageTokenConfig.swaps?.debtToCollateral)
    const quoteReady = !requiresQuote || quoteDebtToCollateral.status === 'ready'
    return (
      form.isAmountValid &&
      form.hasBalance &&
      form.supplyCapOk &&
      !planPreview.isLoading &&
      quoteReady &&
      parseFloat(expectedTokens) > 0 &&
      isConnected &&
      !isAllowanceLoading
    )
  }

  // Check if amount is below minimum for warning
  const isBelowMinimum = () => {
    const amount = parseFloat(form.amount || '0')
    const minAmount = parseFloat(MIN_MINT_AMOUNT_DISPLAY)
    return amount > 0 && amount < minAmount
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
    } catch (error) {
      // Pass the raw error to ErrorStep - it will handle the formatting
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(errorMessage || 'Approval failed. Please try again.')
      toError()
    }
  }

  // Handle mint confirmation
  const handleConfirm = async () => {
    if (!publicClient) return
    if (!userAddress || !isConnected || !form.amountRaw) return

    // Track funnel step: mint transaction initiated
    analytics.funnelStep('mint_leverage_token', 'transaction_initiated', 2)

    // Immediately show awaiting wallet state to avoid perceived lag
    toPending()

    const proceed = async () => {
      // Provide user feedback if we need to switch chains
      if (
        typeof connectedChainId === 'number' &&
        connectedChainId !== leverageTokenConfig.chainId
      ) {
        try {
          toast.message('Switching network…', {
            description: `Switching to ${leverageTokenConfig.chainName}`,
          })
          await switchChainAsync({ chainId: leverageTokenConfig.chainId })
        } catch (switchErr) {
          const msg =
            switchErr instanceof Error
              ? switchErr.message
              : 'Please switch to the correct network in your wallet and try again.'
          setError(msg)
          toError()
          return
        }
      }

      try {
        const p = planPreview.plan
        if (!p || !userAddress) throw new Error('Missing finalized plan or account')

        const hash = await mintWrite.mutateAsync({
          config: wagmiConfig,
          chainId: leverageTokenConfig.chainId as SupportedChainId,
          account: userAddress as `0x${string}`,
          token: leverageTokenAddress,
          plan: {
            inputAsset: p.inputAsset,
            equityInInputAsset: p.equityInInputAsset,
            minShares: p.minShares,
            calls: p.calls,
            expectedTotalCollateral: p.expectedTotalCollateral,
            expectedDebt: p.expectedDebt,
            flashLoanAmount: p.flashLoanAmount,
          },
        })
        setTransactionHash(hash)
      } catch (e: unknown) {
        const error = e as Error

        // Track mint transaction error
        trackTransactionError('mint_failed', 'leverage_token', error.message)

        const provider = (() => {
          const swap = leverageTokenConfig.swaps?.debtToCollateral
          if (!swap) return undefined
          if (swap.type === 'lifi') return 'lifi'
          if (swap.type === 'uniswapV2' || swap.type === 'uniswapV3') return 'uniswap'
          return undefined
        })()

        captureTxError({
          flow: 'mint',
          chainId: leverageTokenConfig.chainId,
          ...(typeof connectedChainId === 'number' ? { connectedChainId } : {}),
          token: leverageTokenAddress,
          inputAsset: leverageTokenConfig.collateralAsset.address,
          slippageBps,
          amountIn: form.amount,
          expectedOut: String(expectedTokens),
          ...(provider ? { provider } : {}),
          error,
        })

        // Pass the raw error to ErrorStep - it will handle the formatting
        setError(error?.message || 'Mint failed. Please try again.')
        toError()
      }
    }

    // Kick off the async flow without blocking this render; UI is already Pending
    void proceed()
  }

  // Handle retry from error state
  const handleRetry = () => {
    toInput()
    setError('')
  }

  // Handle modal close
  const handleClose = () => {
    // Prevent closing while any tx is on-chain pending
    if (currentStep === 'pending') return
    if (currentStep === 'approve' && approveHash) return
    // Reset tx state so next open starts clean
    setTransactionHash(undefined)
    onClose()
  }

  // Derive calculating state (used to suppress warnings during refresh)
  const isCalculating =
    typeof form.amountRaw === 'bigint' &&
    form.amountRaw > 0n &&
    (assetsLoading ||
      planPreview.isLoading ||
      (Boolean(leverageTokenConfig.swaps?.debtToCollateral) &&
        quoteDebtToCollateral.status !== 'ready'))

  // Precompute USD strings for debt payout and totals
  const expectedDebtUsdOutStr = useMemo(() => {
    const plan = planPreview.plan
    if (!plan || !debtUsdPrice) return undefined
    const priceDebt = parseUsdPrice(debtUsdPrice)
    const usd = toScaledUsd(
      plan.expectedExcessDebt ?? 0n,
      leverageTokenConfig.debtAsset.decimals,
      priceDebt,
    )
    return usdToFixedString(usd, 2)
  }, [planPreview.plan, debtUsdPrice, leverageTokenConfig.debtAsset.decimals])

  const totalUsdOutStr = useMemo(() => {
    if (!expectedUsdOutScaled) return undefined
    const plan = planPreview.plan
    if (!plan || !debtUsdPrice) return usdToFixedString(expectedUsdOutScaled, 2)
    const priceDebt = parseUsdPrice(debtUsdPrice)
    const debtUsd = toScaledUsd(
      plan.expectedExcessDebt ?? 0n,
      leverageTokenConfig.debtAsset.decimals,
      priceDebt,
    )
    const total = expectedUsdOutScaled + debtUsd
    return usdToFixedString(total, 2)
  }, [expectedUsdOutScaled, planPreview.plan, debtUsdPrice, leverageTokenConfig.debtAsset.decimals])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'userInput':
        return (
          <InputStep
            selectedToken={selectedTokenView}
            availableTokens={availableTokens}
            amount={form.amount}
            onAmountChange={handleAmountChange}
            onTokenChange={setSelectedToken}
            onPercentageClick={handlePercentageClick}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            slippage={slippage}
            onSlippageChange={setSlippage}
            isCollateralBalanceLoading={isCollateralBalanceLoading}
            isUsdPriceLoading={isUsdPriceLoading}
            isCalculating={isCalculating}
            isAllowanceLoading={isAllowanceLoading}
            isApproving={!!isApprovingPending}
            expectedTokens={expectedTokens}
            expectedUsdOutStr={expectedUsdOutStr}
            guaranteedUsdOutStr={impactWarning ? guaranteedUsdOutStr : undefined}
            expectedDebtUsdOutStr={expectedDebtUsdOutStr}
            totalUsdOutStr={totalUsdOutStr}
            breakdown={showBreakdown ? breakdown : []}
            {...(!isCalculating && impactWarning ? { impactWarning } : {})}
            canProceed={canProceed()}
            needsApproval={needsApproval()}
            isConnected={isConnected}
            onApprove={handleApprove}
            error={error || planPreview.error?.message || undefined}
            leverageTokenConfig={leverageTokenConfig}
            managementFee={fees?.managementTreasuryFee}
            isManagementFeeLoading={isFeesLoading}
            mintTokenFee={fees?.mintTokenFee}
            isMintTokenFeeLoading={isFeesLoading}
            isBelowMinimum={isBelowMinimum()}
            supplyCapExceeded={!form.supplyCapOk}
            expectedDebtAmount={expectedExcessDebtAmount}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
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
            expectedTokens={expectedTokens}
            leverageTokenConfig={{
              symbol: leverageTokenConfig.symbol,
              name: leverageTokenConfig.name,
              leverageRatio: leverageTokenConfig.leverageRatio,
              chainId: leverageTokenConfig.chainId,
            }}
            onConfirm={handleConfirm}
            disabled={
              isCalculating ||
              (Boolean(leverageTokenConfig.swaps?.debtToCollateral) &&
                quoteDebtToCollateral.status !== 'ready') ||
              !planPreview.plan
            }
            expectedDebtAmount={expectedExcessDebtAmount}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
          />
        )

      case 'pending':
        return (
          <PendingStep
            expectedTokens={actualMintedTokens ?? expectedTokens}
            leverageTokenConfig={leverageTokenConfig}
            mode={transactionHash ? 'onChain' : 'awaitingWallet'}
            transactionHash={transactionHash}
            expectedDebtAmount={expectedExcessDebtAmount}
            debtAssetSymbol={leverageTokenConfig.debtAsset.symbol}
          />
        )

      case 'success':
        return (
          <SuccessStep
            selectedToken={selectedTokenView}
            amount={form.amount}
            expectedTokens={actualMintedTokens ?? expectedTokens}
            leverageTokenSymbol={leverageTokenConfig.symbol}
            transactionHash={transactionHash ?? ''}
            onClose={handleClose}
            actualDebtAmount={actualExcessDebtAmountReceived}
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
      title={currentStep === 'success' ? 'Mint Success' : 'Mint Leverage Token'}
      description={currentStep === 'success' ? 'Your leverage tokens have been successfully.' : ''}
      currentStep={currentStep}
      steps={steps}
      className="max-w-lg border border-[var(--divider-line)] bg-[var(--surface-card)]"
      closable={!(currentStep === 'pending' || (currentStep === 'approve' && Boolean(approveHash)))}
    >
      {renderStepContent()}
    </MultiStepModal>
  )
}

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
