import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { useAccount, useConfig, usePublicClient, useSwitchChain } from 'wagmi'
import { useGA, useTransactionGA } from '@/lib/config/ga4.config'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { readLeverageManagerV2ConvertToAssets } from '@/lib/contracts/generated'
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
import { useMintExecution } from '../../hooks/mint/useMintExecution'
import { useMintForm } from '../../hooks/mint/useMintForm'
import { useMintPlanPreview } from '../../hooks/mint/useMintPlanPreview'
import { useMintSteps } from '../../hooks/mint/useMintSteps'
import { useSlippage } from '../../hooks/mint/useSlippage'
import { useLeverageTokenFees } from '../../hooks/useLeverageTokenFees'
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

  // Get USD price for collateral asset
  const { data: usdPriceMap, isLoading: isUsdPriceLoading } = useUsdPrices({
    chainId: leverageTokenConfig.chainId,
    addresses: [leverageTokenConfig.collateralAsset.address],
    enabled: Boolean(leverageTokenConfig.collateralAsset.address),
  })

  // Get USD price for the collateral asset
  const collateralUsdPrice =
    usdPriceMap?.[leverageTokenConfig.collateralAsset.address.toLowerCase()]

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
  // Derive expected tokens from preview data (no local state needed)
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  // Hooks: form, preview, allowance, execution
  const form = useMintForm({
    decimals: leverageTokenConfig.collateralAsset.decimals,
    walletBalanceFormatted: collateralBalanceFormatted,
    minAmountFormatted: MIN_MINT_AMOUNT_DISPLAY,
  })

  // Removed legacy manager/router preview in favor of route-aware plan preview

  // Optional: route-aware plan preview (uses the actual swap configuration)
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

  // Prefer router-aware preview path to align with tests/integration

  const planPreview = useMintPlanPreview({
    config: wagmiConfig,
    token: leverageTokenAddress,
    inputAsset: leverageTokenConfig.collateralAsset.address,
    equityInCollateralAsset: form.amountRaw,
    slippageBps,
    chainId: leverageTokenConfig.chainId,
    ...(quoteDebtToCollateral.quote ? { quote: quoteDebtToCollateral.quote } : {}),
  })

  // Estimate USD value of expected shares using manager's convertToAssets(1e18)
  const sharePriceQuery = useQuery({
    queryKey: ['lt-share-price', leverageTokenAddress, leverageTokenConfig.chainId],
    enabled: Boolean(leverageTokenAddress && collateralUsdPrice),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const one = 10n ** 18n
      return readLeverageManagerV2ConvertToAssets(wagmiConfig, {
        args: [leverageTokenAddress, one],
        chainId: leverageTokenConfig.chainId as SupportedChainId,
      })
    },
  })

  const expectedUsdOut: number | undefined = useMemo(() => {
    const sharesRaw = planPreview.plan?.expectedShares
    const assetsPerShare = sharePriceQuery.data
    if (!sharesRaw || !assetsPerShare || !collateralUsdPrice) return undefined
    try {
      const assetsOut = (sharesRaw * assetsPerShare) / 10n ** 18n
      const collateralOut = Number(
        formatUnits(assetsOut, leverageTokenConfig.collateralAsset.decimals),
      )
      return Number.isFinite(collateralOut) ? collateralOut * collateralUsdPrice : undefined
    } catch {
      return undefined
    }
  }, [
    planPreview.plan?.expectedShares,
    sharePriceQuery.data,
    collateralUsdPrice,
    leverageTokenConfig.collateralAsset.decimals,
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

  const exec = useMintExecution({
    token: leverageTokenAddress,
    ...(userAddress ? { account: userAddress } : {}),
    inputAsset: leverageTokenConfig.collateralAsset.address,
    slippageBps,
  })

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

    toPending()
    try {
      const hash = await exec.mint(form.amountRaw)
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
            isCalculating={
              typeof form.amountRaw === 'bigint' &&
              form.amountRaw > 0n &&
              (planPreview.isLoading ||
                (Boolean(leverageTokenConfig.swaps?.debtToCollateral) &&
                  quoteDebtToCollateral.status !== 'ready'))
            }
            isAllowanceLoading={isAllowanceLoading}
            isApproving={!!isApprovingPending}
            expectedTokens={expectedTokens}
            expectedUsdOut={expectedUsdOut}
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
