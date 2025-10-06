"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { 
  ArrowDownUp, 
  Settings, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  ExternalLink,
  Percent,
  RefreshCw,
  TrendingUp,
  Zap
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  icon: string
}

interface LeverageTokenMintModalProps {
  isOpen: boolean
  onClose: () => void
  strategyId: string
}

type MintStep = 'input' | 'approve' | 'confirm' | 'pending' | 'success' | 'error'

export function LeverageTokenMintModal({ isOpen, onClose, strategyId }: LeverageTokenMintModalProps) {
  // Mock leverage token data
  const leverageTokenData = {
    name: 'weETH / WETH 17x Leverage Token',
    symbol: 'weETH/WETH-17x',
    targetLeverage: '17.00x',
    currentLeverage: '16.85x',
    apy: '18.67%',
    description: 'High-yield leveraged position on weETH/WETH pair'
  }

  const [currentStep, setCurrentStep] = useState<MintStep>('input')
  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: 'weETH',
    name: 'Wrapped Ethereum Staked',
    balance: '2,450.75',
    price: 2489.12,
    icon: '🔥'
  })
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [expectedTokens, setExpectedTokens] = useState('0')
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  // Available tokens for minting
  const availableTokens: Token[] = [
    {
      symbol: 'weETH',
      name: 'Wrapped Ethereum Staked',
      balance: '2,450.75',
      price: 2489.12,
      icon: '🔥'
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      balance: '1,834.20',
      price: 2456.78,
      icon: '⚡'
    }
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

  // Calculate expected leverage tokens based on input amount
  const calculateExpectedTokens = useCallback(async (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setExpectedTokens('0')
      return
    }

    setIsCalculating(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
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
  }, [selectedToken.symbol])

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
    const balance = parseFloat(selectedToken.balance.replace(/,/g, ''))
    const newAmount = (balance * percentage / 100).toFixed(6)
    setAmount(newAmount)
    calculateExpectedTokens(newAmount)
  }

  // Validate mint
  const canProceed = () => {
    const inputAmount = parseFloat(amount)
    const balance = parseFloat(selectedToken.balance.replace(/,/g, ''))
    const minMint = 0.01 // Minimum mint amount
    
    return inputAmount > 0 && 
           inputAmount <= balance && 
           inputAmount >= minMint && 
           !isCalculating &&
           parseFloat(expectedTokens) > 0
  }

  // Handle approval step
  const handleApprove = async () => {
    setCurrentStep('approve')
    
    try {
      // Simulate approval transaction
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast.success('Token approval confirmed', {
        description: `${selectedToken.symbol} spending approved`
      })
      
      setCurrentStep('confirm')
    } catch (error) {
      setError('Approval failed. Please try again.')
      setCurrentStep('error')
    }
  }

  // Handle mint confirmation
  const handleConfirm = async () => {
    setCurrentStep('pending')
    
    try {
      // Simulate mint transaction
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Mock transaction hash
      const mockHash = '0x' + Math.random().toString(16).substr(2, 64)
      setTransactionHash(mockHash)
      
      toast.success('Leverage tokens minted successfully!', {
        description: `${amount} ${selectedToken.symbol} minted to ${expectedTokens} leverage tokens`
      })
      
      setCurrentStep('success')
    } catch (error) {
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

  // Get step progress
  const getStepProgress = () => {
    switch (currentStep) {
      case 'input': return 25
      case 'approve': return 50
      case 'confirm': return 75
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
            {/* Token Selection and Amount Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  Mint Amount
                </label>
                <div className="text-xs text-slate-400">
                  Balance: {selectedToken.balance} {selectedToken.symbol}
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
                      ≈ ${(parseFloat(amount || '0') * selectedToken.price).toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedToken.symbol}
                      onChange={(e) => {
                        const token = availableTokens.find(t => t.symbol === e.target.value)
                        if (token) setSelectedToken(token)
                      }}
                      className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      {availableTokens.map((token) => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.icon} {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Percentage shortcuts */}
                <div className="flex items-center justify-between">
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

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Advanced
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">
                      Slippage Tolerance
                    </label>
                    <div className="flex items-center space-x-2">
                      {['0.1', '0.5', '1.0'].map((value) => (
                        <Button
                          key={value}
                          variant={slippage === value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlippage(value)}
                          className={`h-8 px-3 text-xs ${
                            slippage === value
                              ? 'bg-purple-600 text-white hover:bg-purple-500'
                              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {value}%
                        </Button>
                      ))}
                      <div className="flex items-center space-x-1">
                        <Input
                          type="text"
                          value={slippage}
                          onChange={(e) => setSlippage(e.target.value)}
                          className="w-16 h-8 text-xs text-center bg-slate-900 border-slate-600 text-white"
                          placeholder="0.5"
                        />
                        <Percent className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      {isCalculating ? '...' : expectedTokens}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      Leverage Tokens
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white">
                      {leverageTokenData.symbol}
                    </span>
                  </div>
                </div>

                {/* Leverage Info */}
                {parseFloat(expectedTokens) > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Target Leverage</span>
                      <div className="flex items-center text-purple-400">
                        <span className="font-semibold">{leverageTokenData.targetLeverage}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-3">Transaction Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mint Amount</span>
                  <span className="text-white">{amount || '0'} {selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current APY</span>
                  <span className="text-green-400">{leverageTokenData.apy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Management Fee</span>
                  <span className="text-white">2.0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slippage Tolerance</span>
                  <span className="text-white">{slippage}%</span>
                </div>
                <Separator className="my-2 bg-slate-700" />
                <div className="flex justify-between font-medium">
                  <span className="text-white">You will receive</span>
                  <span className="text-white">{expectedTokens} tokens</span>
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
              onClick={handleApprove}
              disabled={!canProceed()}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium"
            >
              {!canProceed() && parseFloat(amount || '0') === 0 
                ? 'Enter an amount'
                : !canProceed() && parseFloat(amount || '0') > parseFloat(selectedToken.balance.replace(/,/g, ''))
                ? 'Insufficient balance'
                : !canProceed() && parseFloat(amount || '0') < 0.01
                ? 'Minimum mint: 0.01'
                : isCalculating
                ? 'Calculating...'
                : `Approve ${selectedToken.symbol}`
              }
            </Button>
          </div>
        )

      case 'approve':
        return (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Approve Token Spending
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                Approve the contract to spend your {selectedToken.symbol}. This is a one-time approval for this token.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Token</span>
                  <span className="text-white">{selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount to approve</span>
                  <span className="text-white">{amount} {selectedToken.symbol}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">
                Confirm Mint
              </h3>
              <p className="text-slate-400">
                Review your mint details and confirm the transaction
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Minting</span>
                  <div className="flex items-center">
                    <span className="text-white font-medium mr-2">
                      {amount} {selectedToken.symbol}
                    </span>
                    <span className="text-lg">{selectedToken.icon}</span>
                  </div>
                </div>
                
                <div className="flex justify-center py-2">
                  <ArrowDownUp className="h-4 w-4 text-slate-400" />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Receiving</span>
                  <div className="flex items-center">
                    <span className="text-white font-medium mr-2">
                      {expectedTokens} tokens
                    </span>
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-3">Final Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Leverage Token</span>
                  <span className="text-white">{leverageTokenData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Leverage</span>
                  <span className="text-purple-400">{leverageTokenData.targetLeverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Gas</span>
                  <span className="text-white">$3.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Cost</span>
                  <span className="text-white">
                    {amount} {selectedToken.symbol} + Gas
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium"
            >
              <Zap className="h-4 w-4 mr-2" />
              Confirm Mint
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
                Processing Mint
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                Your leverage token mint is being processed. This may take a few moments.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white">{amount} {selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Leverage Token</span>
                  <span className="text-white">{leverageTokenData.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-yellow-400">Confirming...</span>
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
                Mint Successful!
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                Your {amount} {selectedToken.symbol} has been successfully minted into {expectedTokens} leverage tokens.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Minted</span>
                  <span className="text-white">{amount} {selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Received</span>
                  <span className="text-white">{expectedTokens} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction</span>
                  <button
                    onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
                    className="text-purple-400 hover:underline flex items-center hover:cursor-pointer"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start text-sm">
                <TrendingUp className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-green-400">
                  <p className="font-medium">Leverage position active!</p>
                  <p className="text-xs mt-1 opacity-90">
                    Your leverage tokens are now earning {leverageTokenData.apy} APY with {leverageTokenData.targetLeverage} leverage.
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
                Transaction Failed
              </h3>
              <p className="text-slate-400 text-center max-w-sm">
                {error || 'Something went wrong with your mint. Please try again.'}
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
            {currentStep === 'success' ? 'Mint Complete' : 'Mint Leverage Token'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {currentStep === 'success' 
              ? 'Your leverage tokens have been successfully minted and are now earning yield.'
              : 'Mint leverage tokens to gain amplified exposure to the underlying asset pair.'
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
                <span>Step {currentStep === 'input' ? '1' : currentStep === 'approve' ? '2' : currentStep === 'confirm' ? '3' : '4'} of 4</span>
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