"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
import { 
  ArrowDownUp, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  TrendingDown,
  DollarSign
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface Position {
  tokens: string
  value: string
  earned: string
  minted: string
}

interface LeverageTokenRedeemModalProps {
  isOpen: boolean
  onClose: () => void
  strategyId: string
}

type RedeemStep = 'input' | 'confirm' | 'pending' | 'success' | 'error'

export function LeverageTokenRedeemModal({ isOpen, onClose, strategyId }: LeverageTokenRedeemModalProps) {
  // Mock leverage token data
  const leverageTokenData = {
    name: 'weETH / WETH 17x Leverage Token',
    symbol: 'weETH/WETH-17x',
    targetLeverage: '17.00x',
    currentLeverage: '16.85x',
    apy: '18.67%',
    description: 'High-yield leveraged position on weETH/WETH pair',
    redeemFee: '0.2%'
  }

  const position: Position = {
    tokens: '125.45',
    value: '$15,678.90',
    earned: '$1,234.56',
    minted: '$14,444.34'
  }

  const [currentStep, setCurrentStep] = useState<RedeemStep>('input')
  const [amount, setAmount] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [expectedAmount, setExpectedAmount] = useState('0')
  const [selectedAsset, setSelectedAsset] = useState('weETH')
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('input')
      setAmount('')
      setError('')
      setTransactionHash('')
      setExpectedAmount('0')
    }
  }, [isOpen])

  // Calculate expected redemption amount
  const calculateExpectedAmount = useCallback(async (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setExpectedAmount('0')
      return
    }

    setIsCalculating(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const input = parseFloat(inputAmount)
      const tokenValue = parseFloat(position.value.replace(/[$,]/g, '')) / parseFloat(position.tokens)
      
      // Calculate redemption amount (tokens * token value - small fee)
      const expectedOutput = input * tokenValue * 0.998 // 0.2% fee
      
      setExpectedAmount(expectedOutput.toFixed(2))
    } catch (error) {
      console.error('Failed to calculate redemption:', error)
      setExpectedAmount('0')
    } finally {
      setIsCalculating(false)
    }
  }, [position])

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
    const availableTokens = parseFloat(position.tokens)
    const newAmount = (availableTokens * percentage / 100).toFixed(6)
    setAmount(newAmount)
    calculateExpectedAmount(newAmount)
  }

  // Validate redemption
  const canProceed = () => {
    const inputAmount = parseFloat(amount)
    const availableTokens = parseFloat(position.tokens)
    
    return inputAmount > 0 && 
           inputAmount <= availableTokens && 
           !isCalculating &&
           parseFloat(expectedAmount) > 0
  }

  // Handle redemption confirmation
  const handleConfirm = async () => {
    setCurrentStep('pending')
    
    try {
      // Simulate redemption transaction
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock transaction hash
      const mockHash = '0x' + Math.random().toString(16).substr(2, 64)
      setTransactionHash(mockHash)
      
      toast.success('Redemption successful!', {
        description: `${amount} tokens redeemed for ${expectedAmount} ${selectedAsset}`
      })
      
      setCurrentStep('success')
    } catch (error) {
      setError('Redemption failed. Please try again.')
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

  // Get step progress
  const getStepProgress = () => {
    switch (currentStep) {
      case 'input': return 33
      case 'confirm': return 66
      case 'pending': return 90
      case 'success': return 100
      case 'error': return 50
      default: return 0
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-6">
            {/* Position Overview */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-3">Your Position</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block">Leverage Tokens</span>
                  <span className="text-white font-medium">{position.tokens}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Current Value</span>
                  <span className="text-white font-medium">{position.value}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Earned</span>
                  <span className="text-green-400 font-medium">+{position.earned}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Originally Minted</span>
                  <span className="text-white font-medium">{position.minted}</span>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  Redemption Amount (Tokens)
                </label>
                <div className="text-xs text-slate-400">
                  Available: {position.tokens} tokens
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="border-0 bg-transparent text-2xl p-0 h-auto focus:ring-0 focus:ring-offset-0 font-medium text-white"
                    />
                    <div className="text-sm text-slate-400 mt-1">
                      ≈ ${((parseFloat(amount || '0') * parseFloat(position.value.replace(/[$,]/g, '')) / parseFloat(position.tokens)) || 0).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center">
                      <TrendingDown className="h-3 w-3 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white">Tokens</span>
                  </div>
                </div>

                {/* Percentage shortcuts */}
                <div className="flex space-x-2">
                  {[25, 50, 75, 100].map((percentage) => (
                    <Button
                      key={percentage}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePercentageClick(percentage)}
                      className="h-7 px-2 text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      {percentage === 100 ? 'MAX' : `${percentage}%`}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Asset Selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-white">
                Redeem to
              </label>
              <div className="flex space-x-3">
                {['weETH', 'WETH'].map((asset) => (
                  <Button
                    key={asset}
                    variant={selectedAsset === asset ? 'default' : 'outline'}
                    onClick={() => setSelectedAsset(asset)}
                    className={`flex-1 ${
                      selectedAsset === asset
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {asset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Expected Output */}
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="p-2 bg-slate-800/50 rounded-full border border-slate-700">
                  <ArrowDownUp className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-400">You will receive</label>
                  {isCalculating && (
                    <div className="flex items-center text-xs text-slate-400">
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      Calculating...
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-2xl font-medium text-white">
                      {isCalculating ? '...' : `${expectedAmount}`}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {selectedAsset}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <DollarSign className="h-3 w-3 text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-white">{selectedAsset}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Notice */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center text-sm text-slate-300">
                <TrendingDown className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Redemption Fee</p>
                  <p className="text-xs mt-1">
                    A {leverageTokenData.redeemFee} redemption fee applies to cover rebalancing costs.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={() => setCurrentStep('confirm')}
              disabled={!canProceed()}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium"
            >
              {!canProceed() && parseFloat(amount || '0') === 0 
                ? 'Enter an amount'
                : !canProceed() && parseFloat(amount || '0') > parseFloat(position.tokens)
                ? 'Insufficient tokens'
                : isCalculating
                ? 'Calculating...'
                : 'Review Redemption'
              }
            </Button>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">
                Confirm Redemption
              </h3>
              <p className="text-slate-400">
                Review your redemption details and confirm the transaction
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Redeeming</span>
                  <div className="flex items-center">
                    <span className="text-white font-medium mr-2">
                      {amount} tokens
                    </span>
                    <TrendingDown className="h-4 w-4 text-purple-400" />
                  </div>
                </div>
                
                <div className="flex justify-center py-2">
                  <ArrowDownUp className="h-4 w-4 text-slate-400" />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Receiving</span>
                  <div className="flex items-center">
                    <span className="text-white font-medium mr-2">
                      {expectedAmount} {selectedAsset}
                    </span>
                    <DollarSign className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Leverage Token</span>
                  <span className="text-white">{leverageTokenData.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Redeem Asset</span>
                  <span className="text-white">{selectedAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Redemption Fee</span>
                  <span className="text-white">{leverageTokenData.redeemFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Gas</span>
                  <span className="text-white">$2.80</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium"
            >
              Confirm Redemption
            </Button>
          </div>
        )

      case 'pending':
        return (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Processing Redemption
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                Your redemption is being processed. This may take a few moments.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white">{amount} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Leverage Token</span>
                  <span className="text-white">{leverageTokenData.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-yellow-400">Processing...</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Redemption Completed!
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                Your {amount} leverage tokens have been successfully redeemed for {expectedAmount} {selectedAsset}.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Redeemed</span>
                  <span className="text-white">{amount} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Received</span>
                  <span className="text-white">{expectedAmount} {selectedAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction</span>
                  <button
                    onClick={() => window.open(`https://basescan.org/tx/${transactionHash}`, '_blank')}
                    className="text-purple-400 hover:underline flex items-center"
                  >
                    View on Basescan
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-start text-sm">
                <TrendingDown className="h-4 w-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-slate-300">
                  <p className="font-medium text-white">Redemption complete</p>
                  <p className="text-xs mt-1">
                    Your {selectedAsset} has been transferred to your wallet. Track your remaining positions in your Portfolio.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium"
            >
              Done
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Redemption Failed
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                {error || 'Something went wrong with your redemption. Please try again.'}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Try Again
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        {/* Header */}
        <DialogHeader className="relative">
          <DialogTitle className="text-white">
            {currentStep === 'success' ? 'Redemption Status' : 'Redeem Leverage Token'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {currentStep === 'success' 
              ? 'Your redemption request has been processed successfully.'
              : 'Redeem your leverage tokens back to the underlying assets.'
            }
          </DialogDescription>
          
          {/* Progress bar */}
          {currentStep !== 'success' && currentStep !== 'error' && (
            <div className="mt-4">
              <Progress 
                value={getStepProgress()} 
                className="h-1 bg-slate-800" 
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Step {currentStep === 'input' ? '1' : currentStep === 'confirm' ? '2' : '3'} of 3</span>
                <span className="capitalize">{currentStep}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Step Content */}
        <div className="mt-6">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}