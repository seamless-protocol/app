import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { useAccount, useConfig, usePublicClient, useSwitchChain } from 'wagmi'
import { useGA, useTransactionGA } from '@/lib/config/ga4.config'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { captureTxError } from '@/lib/observability/sentry'
import { MultiStepModal, type StepConfig } from '../../../../components/multi-step-modal'
import { BASE_WETH, ETH_SENTINEL, getContractAddresses } from '../../../../lib/contracts/addresses'
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
import { useLeverageTokenState } from '../../hooks/useLeverageTokenState'
import { getLeverageTokenConfig } from '../../leverageTokens.config'
import { invalidateAfterReceipt } from '../../utils/invalidateAfterReceipt'
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
  // manager address not needed for mint plan preview anymore

  // Fetch leverage token fees
  const { data: fees, isLoading: isFeesLoading } = useLeverageTokenFees(leverageTokenAddress)

  // Fetch leverage token state (current supply)
  const { data: leverageTokenState } = useLeverageTokenState(
    leverageTokenAddress,
    leverageTokenConfig.chainId,
  )

  // Get real wallet balance for collateral asset
  const {
    balance: collateralBalance,
    isLoading: isCollateralBalanceLoading,
    refetch: refetchCollateralBalance,
  } = useTokenBalance({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(userAddress && isConnected),
  })

  // Track user's leverage token balance for immediate holdings refresh after mint
  const { refetch: refetchLeverageTokenBalance } = useTokenBalance({
    tokenAddress: leverageTokenAddress,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(userAddress && isConnected),
  })

  // Get USD prices for collateral and debt assets
  const { data: usdPriceMap, isLoading: isUsdPriceLoading } = useUsdPrices({
    chainId: leverageTokenConfig.chainId,
    addresses: [leverageTokenConfig.collateralAsset.address, leverageTokenConfig.debtAsset.address],
    enabled: Boolean(
      leverageTokenConfig.collateralAsset.address && leverageTokenConfig.debtAsset.address,
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
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')
  const [isRefreshingRoute, setIsRefreshingRoute] = useState(false)

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
    ...(quoteDebtToCollateral.quote ? { quote: quoteDebtToCollateral.quote } : {}),
    collateralUsdPrice,
    debtUsdPrice,
    collateralDecimals: leverageTokenConfig.collateralAsset.decimals,
    debtDecimals: leverageTokenConfig.debtAsset.decimals,
  })

  // USD estimates now derived inside useMintPlanPreview
  const expectedUsdOut = planPreview.expectedUsdOut
  const guaranteedUsdOut = planPreview.guaranteedUsdOut

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

  // Impact warning on stable pairs (LST/WETH) if estimated or guaranteed falls below thresholds
  const impactWarning: string | undefined = useMemo(() => {
    if (expectedUsdOut === undefined || guaranteedUsdOut === undefined) return undefined
    const symbol = leverageTokenConfig.collateralAsset.symbol?.toLowerCase?.()
    const debtSym = leverageTokenConfig.debtAsset.symbol?.toLowerCase?.()
    const stable = (symbol === 'weeth' || symbol === 'wsteth') && debtSym === 'weth'
    if (!stable) return undefined
    const inputUsd = (parseFloat(form.amount || '0') || 0) * (collateralUsdPrice || 0)
    if (!(inputUsd > 0)) return undefined
    const expRatio = typeof expectedUsdOut === 'number' ? expectedUsdOut / inputUsd : 1
    const floorRatio = typeof guaranteedUsdOut === 'number' ? guaranteedUsdOut / inputUsd : 1
    if (floorRatio < 0.95)
      return 'Guaranteed outcome is more than 5% below input value for a stable pair.'
    if (expRatio < 0.97)
      return 'Estimated outcome is more than 3% below input value for a stable pair.'
    return undefined
  }, [
    leverageTokenConfig.collateralAsset.symbol,
    leverageTokenConfig.debtAsset.symbol,
    form.amount,
    collateralUsdPrice,
    expectedUsdOut,
    guaranteedUsdOut,
  ])

  const {
    isAllowanceLoading,
    needsApproval: needsApprovalFlag,
    approve: approveAction,
    isPending: isApprovingPending,
    isApproved: isApprovedFlag,
    error: approveErr,
  } = useApprovalFlow({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    ...(userAddress ? { owner: userAddress } : {}),
    ...(leverageRouterAddress ? { spender: leverageRouterAddress } : {}),
    ...(typeof form.amountRaw !== 'undefined' ? { amountRaw: form.amountRaw } : {}),
    decimals: leverageTokenConfig.collateralAsset.decimals,
    chainId: leverageTokenConfig.chainId,
  })

  const mintWrite = useMintWrite(
    userAddress && planPreview.plan
      ? {
          chainId: leverageTokenConfig.chainId as SupportedChainId,
          token: leverageTokenAddress,
          account: userAddress as `0x${string}`,
          plan: {
            inputAsset: planPreview.plan.inputAsset,
            equityInInputAsset: planPreview.plan.equityInInputAsset,
            minShares: planPreview.plan.minShares,
            calls: planPreview.plan.calls,
            expectedTotalCollateral: planPreview.plan.expectedTotalCollateral,
            expectedDebt: planPreview.plan.expectedDebt,
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
    setTransactionHash('')

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

  const expectedTokens = useMemo(() => {
    const shares = planPreview.plan?.expectedShares
    return formatTokenAmountFromBase(
      shares,
      leverageTokenConfig.decimals,
      TOKEN_AMOUNT_DISPLAY_DECIMALS,
    )
  }, [planPreview.plan?.expectedShares, leverageTokenConfig.decimals])

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

    // Provide user feedback if we need to switch chains
    if (typeof connectedChainId === 'number' && connectedChainId !== leverageTokenConfig.chainId) {
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

    // Pre-flight: protect user's preview floor (minOut) before submitting
    try {
      const plan = planPreview.plan
      const quoteFn = quoteDebtToCollateral.quote
      if (plan && quoteFn) {
        const floor = plan.swapMinOut
        const chainWeth = contractAddresses.tokens?.weth ?? BASE_WETH
        const inToken =
          plan.debtAsset.toLowerCase() === chainWeth.toLowerCase()
            ? ETH_SENTINEL
            : (plan.debtAsset as `0x${string}`)
        const outToken = plan.collateralAsset as `0x${string}`
        const amountIn = plan.flashLoanAmount ?? plan.expectedDebt
        if (amountIn > 0n && floor > 0n) {
          const fresh = await quoteFn({ inToken, outToken, amountIn, intent: 'exactIn' })
          const minNow = typeof fresh.minOut === 'bigint' ? fresh.minOut : fresh.out
          if (minNow < floor) {
            toast.message('Refreshing quote…', {
              description: 'Route moved below your guaranteed floor.',
            })
            // Refresh the plan/quote and keep user on Confirm
            try {
              setIsRefreshingRoute(true)
              await planPreview.refetch?.()
            } catch (_) {
              // Non-fatal; user can retry
            } finally {
              setIsRefreshingRoute(false)
            }
            // Do not block; proceed with execution which re-plans with fresh quotes
          }
        }
      }
    } catch (preCheckErr) {
      const msg = preCheckErr instanceof Error ? preCheckErr.message : 'Route pre-check failed.'
      setError(msg)
      toError()
      return
    }

    toPending()
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
        },
      })
      setTransactionHash(hash)

      // Track successful mint transaction
      const tokenSymbol = leverageTokenConfig.symbol
      const amount = form.amount
      const usdValue = parseFloat(form.amount) * (selectedToken.price || 0)
      trackLeverageTokenMinted(tokenSymbol, amount, usdValue)

      // Track funnel step: mint transaction completed
      analytics.funnelStep('mint_leverage_token', 'transaction_completed', 3)

      toast.success('Leverage tokens minted successfully!', {
        description: `${form.amount} ${selectedToken.symbol} -> ~${expectedTokens} ${leverageTokenConfig.symbol}`,
      })
      // Invalidate protocol state and refresh wallet balances after 1 confirmation
      try {
        await invalidateAfterReceipt(publicClient, queryClient, {
          hash,
          token: leverageTokenAddress,
          chainId: leverageTokenConfig.chainId,
          owner: userAddress,
          includeUser: true,
        })
        // Proactively refresh balances used by the UI
        refetchCollateralBalance?.()
        refetchLeverageTokenBalance?.()
      } catch (_) {
        // Best-effort invalidation; non-fatal for UX
      }
      toSuccess()
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

  // Derive calculating state (used to suppress warnings during refresh)
  const isCalculating =
    typeof form.amountRaw === 'bigint' &&
    form.amountRaw > 0n &&
    (planPreview.isLoading ||
      (Boolean(leverageTokenConfig.swaps?.debtToCollateral) &&
        quoteDebtToCollateral.status !== 'ready'))

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
            expectedUsdOut={expectedUsdOut}
            guaranteedUsdOut={impactWarning ? guaranteedUsdOut : undefined}
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
              isRefreshingRoute ||
              (Boolean(leverageTokenConfig.swaps?.debtToCollateral) &&
                quoteDebtToCollateral.status !== 'ready') ||
              !planPreview.plan
            }
          />
        )

      case 'pending':
        return (
          <PendingStep
            selectedToken={selectedTokenView}
            amount={form.amount}
            leverageTokenConfig={leverageTokenConfig}
          />
        )

      case 'success':
        return (
          <SuccessStep
            selectedToken={selectedTokenView}
            amount={form.amount}
            expectedTokens={expectedTokens}
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
      title={currentStep === 'success' ? 'Mint Success' : 'Mint Leverage Token'}
      description={currentStep === 'success' ? 'Your leverage tokens have been successfully.' : ''}
      currentStep={currentStep}
      steps={steps}
      className="max-w-lg border border-[var(--divider-line)] bg-[var(--surface-card)]"
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
