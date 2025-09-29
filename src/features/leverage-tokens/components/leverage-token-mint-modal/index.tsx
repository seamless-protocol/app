import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { useAccount, useConfig } from 'wagmi'
import { createLogger } from '@/lib/logger'

const logger = createLogger('mint-modal')

import { MultiStepModal, type StepConfig } from '../../../../components/multi-step-modal'
import { getContractAddresses } from '../../../../lib/contracts/addresses'
import { useReadLeverageManagerV2GetManagementFee } from '../../../../lib/contracts/generated'
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
import { useMintExecution } from '../../hooks/mint/useMintExecution'
import { useMintForm } from '../../hooks/mint/useMintForm'
import { useMintPreview } from '../../hooks/mint/useMintPreview'
import { useMintSteps } from '../../hooks/mint/useMintSteps'
import { useSlippage } from '../../hooks/mint/useSlippage'
import { getLeverageTokenConfig } from '../../leverageTokens.config'
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
  apy?: number // Optional APY prop - if not provided, will default to 0
  userAddress?: `0x${string}` // Optional user address - if not provided, will use useAccount
}

// Hoisted to avoid re-creating on every render
const MINT_STEPS: Array<StepConfig> = [
  { id: 'input', label: 'Input', progress: 25 },
  { id: 'approve', label: 'Approve', progress: 50 },
  { id: 'confirm', label: 'Confirm', progress: 75 },
  { id: 'pending', label: 'Processing', progress: 90 },
  { id: 'success', label: 'Success', progress: 100 },
  { id: 'error', label: 'Error', progress: 50 },
]

export function LeverageTokenMintModal({
  isOpen,
  onClose,
  leverageTokenAddress,
  apy,
  userAddress: propUserAddress,
}: LeverageTokenMintModalProps) {
  // Get leverage token configuration by address
  const leverageTokenConfig = getLeverageTokenConfig(leverageTokenAddress)

  // Early return if no configuration found
  if (!leverageTokenConfig) {
    throw new Error(`No configuration found for token address: ${leverageTokenAddress}`)
  }

  // Get user account information
  const { address: hookUserAddress, isConnected, chainId } = useAccount()
  const wagmiConfig = useConfig()
  const userAddress = propUserAddress || hookUserAddress

  // Get leverage router address for allowance check
  const contractAddresses = getContractAddresses(leverageTokenConfig.chainId)
  const leverageRouterAddress = contractAddresses.leverageRouter
  const leverageManagerAddress = contractAddresses.leverageManagerV2

  // Fetch management fee for display (independent from core config)
  const { data: managementFee, isLoading: isManagementFeeLoading } =
    useReadLeverageManagerV2GetManagementFee({
      address: leverageManagerAddress,
      args: [leverageTokenAddress],
      chainId: leverageTokenConfig.chainId,
      query: {
        enabled: Boolean(leverageTokenAddress && leverageManagerAddress),
        staleTime: 60_000, // Cache for 1 minute - fee rarely changes
      },
    })

  // Get real wallet balance for collateral asset
  const { balance: collateralBalance, isLoading: isCollateralBalanceLoading } = useTokenBalance({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
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
  } = useMintSteps('input')

  // Step configuration (static)
  const steps = MINT_STEPS

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

  const preview = useMintPreview({
    config: wagmiConfig,
    token: leverageTokenAddress,
    equityInCollateralAsset: form.amountRaw,
    chainId: leverageTokenConfig.chainId,
  })

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

  // Reset state when modal opens
  const resetModal = useCallback(() => {
    toInput()
    form.setAmount('')
    setError('')
    setTransactionHash('')
  }, [toInput, form.setAmount])

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

  const expectedTokens = useMemo(
    () =>
      formatTokenAmountFromBase(
        preview.data?.shares,
        leverageTokenConfig.decimals,
        TOKEN_AMOUNT_DISPLAY_DECIMALS,
      ),
    [preview.data?.shares, leverageTokenConfig.decimals],
  )

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
    return (
      form.isAmountValid &&
      form.hasBalance &&
      form.minAmountOk &&
      !preview.isLoading &&
      parseFloat(expectedTokens) > 0 &&
      isConnected &&
      !isAllowanceLoading
    )
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

  // Handle mint confirmation
  const handleConfirm = async () => {
    if (!userAddress || !isConnected || !form.amountRaw) return
    toPending()
    try {
      const hash = await exec.mint(form.amountRaw)
      setTransactionHash(hash)
      toast.success('Leverage tokens minted successfully!', {
        description: `${form.amount} ${selectedToken.symbol} -> ~${expectedTokens} tokens`,
      })
      toSuccess()
    } catch (e: unknown) {
      const error = e as Error
      logger.error('Mint failed', {
        error,
        userAddress,
        leverageTokenAddress,
        amount: form.amount,
        amountRaw: form.amountRaw?.toString(),
        chainId: chainId || 0,
        feature: 'mint',
      })

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
      case 'input':
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
            isCalculating={preview.isLoading}
            isAllowanceLoading={isAllowanceLoading}
            isApproving={!!isApprovingPending}
            expectedTokens={expectedTokens}
            canProceed={canProceed()}
            needsApproval={needsApproval()}
            isConnected={isConnected}
            onApprove={handleApprove}
            error={error || undefined}
            leverageTokenConfig={leverageTokenConfig}
            apy={apy ?? undefined}
            managementFee={managementFee}
            isManagementFeeLoading={isManagementFeeLoading}
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
      title={currentStep === 'success' ? 'Mint Complete' : 'Mint Leverage Token'}
      description={
        currentStep === 'success'
          ? 'Your leverage tokens have been successfully minted and are now earning yield.'
          : 'Mint leverage tokens to gain amplified exposure to the underlying asset pair.'
      }
      currentStep={currentStep}
      steps={steps}
      className="max-w-lg bg-slate-900 border-slate-700"
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
