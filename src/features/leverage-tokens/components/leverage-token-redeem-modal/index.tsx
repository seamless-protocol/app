'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { MultiStepModal, type StepConfig } from '../../../../components/multi-step-modal'
import { useTokenBalance } from '../../../../lib/hooks/useTokenBalance'
import { useUsdPrices } from '../../../../lib/prices/useUsdPrices'
import { useRedeemSteps } from '../../hooks/redeem/useRedeemSteps'
import { getLeverageTokenConfig } from '../../leverageTokens.config'
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
  { id: 'input', label: 'Input', progress: 33 },
  { id: 'confirm', label: 'Confirm', progress: 66 },
  { id: 'pending', label: 'Processing', progress: 90 },
  { id: 'success', label: 'Success', progress: 100 },
  { id: 'error', label: 'Error', progress: 50 },
]

export function LeverageTokenRedeemModal({
  isOpen,
  onClose,
  leverageTokenAddress,
  userAddress: propUserAddress,
}: LeverageTokenRedeemModalProps) {
  // Get leverage token configuration by address
  const leverageTokenConfig = getLeverageTokenConfig(leverageTokenAddress)

  // Early return if no configuration found
  if (!leverageTokenConfig) {
    throw new Error(`No configuration found for token address: ${leverageTokenAddress}`)
  }

  // Get user account information
  const { address: hookUserAddress, isConnected } = useAccount()
  const userAddress = propUserAddress || hookUserAddress

  // Get real wallet balance for leverage tokens
  const { balance: leverageTokenBalance, isLoading: isLeverageTokenBalanceLoading } =
    useTokenBalance({
      tokenAddress: leverageTokenAddress,
      userAddress: userAddress as `0x${string}`,
      chainId: leverageTokenConfig.chainId,
      enabled: Boolean(userAddress && isConnected),
    })

  // Get USD price for leverage token
  const { data: usdPriceMap, isLoading: isUsdPriceLoading } = useUsdPrices({
    chainId: leverageTokenConfig.chainId,
    addresses: [leverageTokenAddress, leverageTokenConfig.collateralAsset.address],
    enabled: Boolean(leverageTokenAddress && leverageTokenConfig.collateralAsset.address),
  })

  // Get USD prices
  const leverageTokenUsdPrice = usdPriceMap?.[leverageTokenAddress.toLowerCase()]
  const collateralUsdPrice =
    usdPriceMap?.[leverageTokenConfig.collateralAsset.address.toLowerCase()]

  // Format balances for display
  const leverageTokenBalanceFormatted = leverageTokenBalance
    ? formatUnits(leverageTokenBalance, leverageTokenConfig.collateralAsset.decimals) // Assuming same decimals
    : '0'

  const {
    step: currentStep,
    toInput,
    toConfirm,
    toPending,
    toSuccess,
    toError,
  } = useRedeemSteps('input')

  // Step configuration (static)
  const steps = REDEEM_STEPS

  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: leverageTokenConfig.symbol,
    name: leverageTokenConfig.name,
    balance: leverageTokenBalanceFormatted,
    price: leverageTokenUsdPrice || 0,
  })
  const [amount, setAmount] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(leverageTokenConfig.collateralAsset.symbol)
  const [isCalculating, setIsCalculating] = useState(false)
  const [expectedAmount, setExpectedAmount] = useState('0')
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      toInput()
      setAmount('')
      setError('')
      setTransactionHash('')
      setExpectedAmount('0')
      setSelectedAsset(leverageTokenConfig.collateralAsset.symbol)
    }
  }, [isOpen, leverageTokenConfig.collateralAsset.symbol, toInput])

  // Update selected token balance and price when wallet balance or price changes
  useEffect(() => {
    setSelectedToken((prev) => ({
      ...prev,
      balance: leverageTokenBalanceFormatted,
      price: leverageTokenUsdPrice || 0,
    }))
  }, [leverageTokenBalanceFormatted, leverageTokenUsdPrice])

  // Calculate expected redemption amount based on input amount
  const calculateExpectedAmount = useCallback(async (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setExpectedAmount('0')
      return
    }

    setIsCalculating(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      const input = parseFloat(inputAmount)
      // Mock calculation: redemption ratio (accounting for fees)
      const redemptionRatio = 0.998 // 0.2% redemption fee
      const expectedOutput = input * redemptionRatio

      setExpectedAmount(expectedOutput.toFixed(6))
    } catch (error) {
      console.error('Failed to calculate redemption:', error)
      setExpectedAmount('0')
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Available assets for redemption (collateral asset)
  const availableAssets = [
    {
      symbol: leverageTokenConfig.collateralAsset.symbol,
      name: leverageTokenConfig.collateralAsset.name,
      price: collateralUsdPrice || 0,
    },
  ]

  // Handle amount input changes
  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError('')
      calculateExpectedAmount(value)
    }
  }

  // Handle percentage shortcuts
  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(selectedToken.balance)
    const newAmount = ((balance * percentage) / 100).toFixed(6)
    setAmount(newAmount)
    calculateExpectedAmount(newAmount)
  }

  // Validate redemption
  const canProceed = () => {
    const inputAmount = parseFloat(amount)
    const balance = parseFloat(selectedToken.balance)
    const minRedeem = 0.01 // Minimum redeem amount

    return (
      inputAmount > 0 &&
      inputAmount <= balance &&
      inputAmount >= minRedeem &&
      !isCalculating &&
      parseFloat(expectedAmount) > 0 &&
      isConnected
    )
  }

  // Handle proceed to confirmation
  const handleProceed = async () => {
    toConfirm()
  }

  // Handle redemption confirmation
  const handleConfirm = async () => {
    toPending()

    try {
      // TODO: add actual redeem transaction
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock transaction hash
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`
      setTransactionHash(mockHash)

      toast.success('Redemption successful!', {
        description: `${amount} tokens redeemed for ${expectedAmount} ${selectedAsset}`,
      })

      toSuccess()
    } catch (_error) {
      setError('Redemption failed. Please try again.')
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
            selectedToken={selectedToken}
            availableAssets={availableAssets}
            amount={amount}
            onAmountChange={handleAmountChange}
            onPercentageClick={handlePercentageClick}
            selectedAsset={selectedAsset}
            onAssetChange={setSelectedAsset}
            isLeverageTokenBalanceLoading={isLeverageTokenBalanceLoading}
            isUsdPriceLoading={isUsdPriceLoading}
            isCalculating={isCalculating}
            expectedAmount={expectedAmount}
            canProceed={canProceed()}
            isConnected={isConnected}
            onProceed={handleProceed}
            error={error || undefined}
          />
        )

      case 'confirm':
        return (
          <ConfirmStep
            selectedToken={selectedToken}
            amount={amount}
            expectedAmount={expectedAmount}
            selectedAsset={selectedAsset}
            leverageTokenConfig={leverageTokenConfig}
            onConfirm={handleConfirm}
          />
        )

      case 'pending':
        return <PendingStep amount={amount} leverageTokenConfig={leverageTokenConfig} />

      case 'success':
        return (
          <SuccessStep
            amount={amount}
            expectedAmount={expectedAmount}
            selectedAsset={selectedAsset}
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
      className="max-w-lg bg-slate-900 border-slate-700"
    >
      {renderStepContent()}
    </MultiStepModal>
  )
}
