'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { MultiStepModal, type StepConfig } from '../../../../components/multi-step-modal'
import { getContractAddresses } from '../../../../lib/contracts/addresses'
import { useTokenAllowance } from '../../../../lib/hooks/useTokenAllowance'
import { useTokenApprove } from '../../../../lib/hooks/useTokenApprove'
import { useTokenBalance } from '../../../../lib/hooks/useTokenBalance'
import { useUsdPrices } from '../../../../lib/prices/useUsdPrices'
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

type MintStep = 'input' | 'approve' | 'confirm' | 'pending' | 'success' | 'error'

export function LeverageTokenMintModal({
  isOpen,
  onClose,
  leverageTokenAddress,
  apy,
  userAddress: propUserAddress,
}: LeverageTokenMintModalProps) {
  // Get leverage token configuration by address
  const leverageTokenConfig = getLeverageTokenConfig(leverageTokenAddress)

  if (!leverageTokenConfig) {
    console.error(`No configuration found for token address: ${leverageTokenAddress}`)
    return null
  }

  // Get user account information
  const { address: hookUserAddress, isConnected } = useAccount()
  const userAddress = propUserAddress || hookUserAddress

  // Get real wallet balance for collateral asset
  const { balance: collateralBalance, isLoading: isCollateralBalanceLoading } = useTokenBalance({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    userAddress: userAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(userAddress && isConnected),
  })

  // Get leverage router address for allowance check
  const contractAddresses = getContractAddresses(leverageTokenConfig.chainId)
  const leverageRouterAddress = contractAddresses.leverageRouter

  // Get token allowance for the leverage router
  const { allowance: tokenAllowance, isLoading: isAllowanceLoading } = useTokenAllowance({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    owner: userAddress as `0x${string}`,
    spender: leverageRouterAddress as `0x${string}`,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(userAddress && isConnected && leverageRouterAddress),
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

  const [currentStep, setCurrentStep] = useState<MintStep>('input')

  // Step configuration for the multi-step modal
  const steps: Array<StepConfig> = [
    { id: 'input', label: 'Input', progress: 25 },
    { id: 'approve', label: 'Approve', progress: 50 },
    { id: 'confirm', label: 'Confirm', progress: 75 },
    { id: 'pending', label: 'Processing', progress: 90 },
    { id: 'success', label: 'Success', progress: 100 },
    { id: 'error', label: 'Error', progress: 50 },
  ]

  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: leverageTokenConfig.collateralAsset.symbol,
    name: leverageTokenConfig.collateralAsset.name,
    balance: collateralBalanceFormatted,
    price: collateralUsdPrice || 0, // Real-time USD price from CoinGecko
  })
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [expectedTokens, setExpectedTokens] = useState('0')
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  // Token approval hook
  const {
    approve,
    isPending: isApproving,
    isApproved: isApprovalConfirmed,
    isError: isApprovalError,
    error: approvalError,
  } = useTokenApprove({
    tokenAddress: leverageTokenConfig.collateralAsset.address,
    spender: leverageRouterAddress as `0x${string}`,
    amount: amount, // Use the input amount for approval
    decimals: leverageTokenConfig.collateralAsset.decimals,
    chainId: leverageTokenConfig.chainId,
    enabled: Boolean(leverageRouterAddress && amount && parseFloat(amount) > 0),
    useMaxApproval: true, // Use max approval for better UX
  })

  // Available tokens for minting (only collateral asset for now)
  const availableTokens: Array<Token> = [
    {
      symbol: leverageTokenConfig.collateralAsset.symbol,
      name: leverageTokenConfig.collateralAsset.name,
      balance: collateralBalanceFormatted,
      price: collateralUsdPrice || 0, // Real-time USD price from CoinGecko
    },
  ]

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('input')
      setAmount('')
      setError('')
      setTransactionHash('')
      setExpectedTokens('0')
    }
  }, [isOpen])

  // Update selected token balance and price when wallet balance or price changes
  useEffect(() => {
    if (selectedToken.symbol === leverageTokenConfig.collateralAsset.symbol) {
      setSelectedToken((prev) => ({
        ...prev,
        balance: collateralBalanceFormatted,
        price: collateralUsdPrice || 0,
      }))
    }
  }, [
    collateralBalanceFormatted,
    collateralUsdPrice,
    selectedToken.symbol,
    leverageTokenConfig.collateralAsset.symbol,
  ])

  // Handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed && currentStep === 'approve') {
      toast.success('Token approval confirmed', {
        description: `${selectedToken.symbol} spending approved`,
      })
      setCurrentStep('confirm')
    }
  }, [isApprovalConfirmed, currentStep, selectedToken.symbol])

  // Handle approval errors
  useEffect(() => {
    if (isApprovalError && currentStep === 'approve') {
      setError(approvalError?.message || 'Approval failed. Please try again.')
      setCurrentStep('error')
    }
  }, [isApprovalError, approvalError, currentStep])

  // Calculate expected leverage tokens based on input amount
  const calculateExpectedTokens = useCallback(async (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setExpectedTokens('0')
      return
    }

    setIsCalculating(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      const input = parseFloat(inputAmount)
      // Mock calculation: leverage token minting ratio
      const tokens = input * 0.97 // Account for fees and slippage
      setExpectedTokens(tokens.toFixed(6))
    } catch (error) {
      console.error('Failed to calculate tokens:', error)
      setExpectedTokens('0')
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Handle amount input changes
  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError('')
      calculateExpectedTokens(value)
    }
  }

  // Handle percentage shortcuts
  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(selectedToken.balance)
    const newAmount = ((balance * percentage) / 100).toFixed(6)
    setAmount(newAmount)
    calculateExpectedTokens(newAmount)
  }

  // Check if approval is needed
  const needsApproval = () => {
    if (!amount || parseFloat(amount) <= 0) return false

    const inputAmount = parseFloat(amount)
    const inputAmountWei = BigInt(
      Math.floor(inputAmount * 10 ** leverageTokenConfig.collateralAsset.decimals),
    )

    return tokenAllowance < inputAmountWei
  }

  // Validate mint
  const canProceed = () => {
    const inputAmount = parseFloat(amount)
    const balance = parseFloat(selectedToken.balance)
    const minMint = 0.01 // Minimum mint amount

    return (
      inputAmount > 0 &&
      inputAmount <= balance &&
      inputAmount >= minMint &&
      !isCalculating &&
      parseFloat(expectedTokens) > 0 &&
      isConnected &&
      !isAllowanceLoading
    ) // User must be connected and allowance must be loaded
  }

  // Handle approval step
  const handleApprove = async () => {
    // Skip approval if not needed
    if (!needsApproval()) {
      setCurrentStep('confirm')
      return
    }

    setCurrentStep('approve')

    try {
      approve()
    } catch (_error) {
      setError('Approval failed. Please try again.')
      setCurrentStep('error')
    }
  }

  // Handle mint confirmation
  const handleConfirm = async () => {
    // Set to pending state first
    setCurrentStep('pending')

    try {
      // TODO: add actual mint transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock transaction hash
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`
      setTransactionHash(mockHash)

      toast.success('Leverage tokens minted successfully!', {
        description: `${amount} ${selectedToken.symbol} minted to ${expectedTokens} leverage tokens`,
      })

      setCurrentStep('success')
    } catch (_error) {
      setError('Mint failed. Please try again.')
      setCurrentStep('error')
    }
  }

  // Handle retry from error state
  const handleRetry = () => {
    setCurrentStep('input')
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
            selectedToken={selectedToken}
            availableTokens={availableTokens}
            amount={amount}
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
            isApproving={isApproving}
            expectedTokens={expectedTokens}
            canProceed={canProceed()}
            needsApproval={needsApproval()}
            isConnected={isConnected}
            onApprove={handleApprove}
            error={error || undefined}
            leverageTokenConfig={leverageTokenConfig}
            apy={apy ?? undefined}
          />
        )

      case 'approve':
        return (
          <ApproveStep selectedToken={selectedToken} amount={amount} isApproving={isApproving} />
        )

      case 'confirm':
        return (
          <ConfirmStep
            selectedToken={selectedToken}
            amount={amount}
            expectedTokens={expectedTokens}
            leverageTokenConfig={leverageTokenConfig}
            onConfirm={handleConfirm}
          />
        )

      case 'pending':
        return (
          <PendingStep
            selectedToken={selectedToken}
            amount={amount}
            leverageTokenConfig={leverageTokenConfig}
          />
        )

      case 'success':
        return (
          <SuccessStep
            selectedToken={selectedToken}
            amount={amount}
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
