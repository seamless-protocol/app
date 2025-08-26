"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { motion } from "motion/react"
import { 
  X, 
  ArrowDownUp, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  TrendingDown,
  DollarSign,
  Sparkles,
  CircleCheck
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface Position {
  shares: string
  value: string
  earned: string
  deposited: string
}

interface Strategy {
  id: string
  name: string
  description: string
  apy: string
  tvl: string
  riskLevel: string
  timeToWithdraw?: string
}

interface StrategyWithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  strategyId?: string | null
}

type WithdrawStep = 'input' | 'confirm' | 'pending' | 'success' | 'error'

export function StrategyWithdrawModal({ isOpen, onClose, strategyId }: StrategyWithdrawModalProps) {
  // Mock data - in a real app, this would be fetched based on strategyId
  const strategy: Strategy = {
    id: strategyId || 'eth-usdc-leverage',
    name: 'ETH-USDC Leverage Strategy',
    description: 'Automated leveraged lending strategy',
    apy: '12.34%',
    tvl: '$24.2M',
    riskLevel: 'Medium',
    timeToWithdraw: '72 hours'
  }

  const position: Position = {
    shares: '1234.56',
    value: '$15,678.90',
    earned: '$1,234.56',
    deposited: '$14,444.34'
  }
  const [currentStep, setCurrentStep] = useState<WithdrawStep>('input')
  const [amount, setAmount] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [expectedAmount, setExpectedAmount] = useState('0')
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

  // Calculate expected withdrawal amount
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
      const shareValue = parseFloat(position.value.replace(/[$,]/g, '')) / parseFloat(position.shares)
      
      // Calculate withdrawal amount (shares * share value - small fee)
      const expectedOutput = input * shareValue * 0.995 // 0.5% fee
      
      setExpectedAmount(expectedOutput.toFixed(2))
    } catch (error) {
      console.error('Failed to calculate withdrawal:', error)
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
    const availableShares = parseFloat(position.shares)
    const newAmount = (availableShares * percentage / 100).toFixed(6)
    setAmount(newAmount)
    calculateExpectedAmount(newAmount)
  }

  // Validate withdrawal
  const canProceed = () => {
    const inputAmount = parseFloat(amount)
    const availableShares = parseFloat(position.shares)
    
    return inputAmount > 0 && 
           inputAmount <= availableShares && 
           !isCalculating &&
           parseFloat(expectedAmount) > 0
  }

  // Handle withdrawal confirmation
  const handleConfirm = async () => {
    setCurrentStep('pending')
    
    try {
      // Simulate withdrawal transaction
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock transaction hash
      const mockHash = '0x' + Math.random().toString(16).substr(2, 64)
      setTransactionHash(mockHash)
      
      toast.success('Withdrawal successful!', {
        description: `${amount} shares withdrawn from ${strategy.name}`
      })
      
      setCurrentStep('success')
    } catch (error) {
      setError('Withdrawal failed. Please try again.')
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

  // Error State
  if (currentStep === 'error') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Transaction Failed</DialogTitle>
            <DialogDescription>An error occurred during the withdrawal transaction</DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <X className="h-7 w-7 text-red-400" />
            </motion.div>
            
            <motion.h2 
              className="text-lg font-semibold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              Withdrawal Failed
            </motion.h2>
            
            <motion.p 
              className="text-slate-400 mb-4 text-sm leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {error || 'Something went wrong with your withdrawal. Please try again.'}
            </motion.p>
            
            <motion.div 
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button
                onClick={handleRetry}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Success State
  if (currentStep === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Withdrawal Successful</DialogTitle>
            <DialogDescription>Your withdrawal has been initiated successfully</DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="relative w-16 h-16 mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <CircleCheck className="h-8 w-8 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-30"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <motion.h2 
              className="text-lg font-semibold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              Withdrawal Initiated!
            </motion.h2>
            
            <motion.p 
              className="text-slate-400 mb-4 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Your withdrawal request for {amount} shares has been submitted. You'll receive ${expectedAmount} within {strategy.timeToWithdraw || '72 hours'}.
            </motion.p>
            
            <motion.div 
              className="bg-slate-800/50 rounded-lg p-3 mb-4 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Withdrawn</span>
                <span className="text-white font-medium">{amount} shares</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Receiving</span>
                <span className="text-green-400 font-medium">${expectedAmount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className="text-yellow-400">Processing</span>
              </div>
              
              <Separator className="my-2 bg-slate-700" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Transaction</span>
                <button
                  onClick={() => window.open(`https://basescan.org/tx/${transactionHash}`, '_blank')}
                  className="text-purple-400 hover:underline flex items-center"
                >
                  View on Basescan
                  <ExternalLink className="h-3 w-3 ml-1" />
                </button>
              </div>
            </motion.div>

            <motion.div 
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <div className="flex items-start text-sm">
                <TrendingDown className="h-4 w-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-slate-400">
                  <p className="font-medium text-white">Processing in progress</p>
                  <p className="text-xs mt-1">
                    Your withdrawal will be completed within {strategy.timeToWithdraw || '72 hours'}. Track the status in your Portfolio.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Button
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                Done
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Transaction Processing State
  if (currentStep === 'pending') {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Processing Transaction</DialogTitle>
            <DialogDescription>Your withdrawal transaction is being processed</DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="relative w-16 h-16 mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            
            <h2 className="text-lg font-semibold text-white mb-3">
              Processing Withdrawal
            </h2>
            
            <p className="text-slate-400 text-center max-w-sm mb-4">
              Your withdrawal is being processed. This may take a few moments.
            </p>
            
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white">{amount} shares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Strategy</span>
                  <span className="text-white">{strategy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-yellow-400">Processing...</span>
                </div>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-xl max-h-[85vh] overflow-hidden backdrop-blur-sm">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center space-x-3 text-white">
            <div className="w-7 h-7 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <span>{currentStep === 'success' ? 'Withdrawal Status' : 'Withdraw from Strategy'}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {currentStep === 'success' 
              ? 'Your withdrawal request has been processed. Check the details below for more information.'
              : currentStep === 'confirm'
              ? 'Review your withdrawal details and confirm the transaction'
              : 'Withdraw your funds from this strategy and receive USDC.'
            }
          </DialogDescription>
          
          {/* Progress bar */}
          {currentStep !== 'success' && currentStep !== 'error' && (
            <div className="mt-3">
              <Progress 
                value={getStepProgress()} 
                className="h-2 bg-slate-800"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Step {currentStep === 'input' ? '1' : currentStep === 'confirm' ? '2' : '3'} of 3</span>
                <span className="capitalize">{currentStep}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4 overflow-auto">
          {/* Render step content */}
          {currentStep === 'input' && (
            <div className="space-y-4">
              {/* Position Overview */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-3">Your Position</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 block">Total Shares</span>
                    <span className="text-white font-medium">{position.shares}</span>
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
                    <span className="text-slate-400 block">Deposited</span>
                    <span className="text-white font-medium">{position.deposited}</span>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">
                    Withdrawal Amount (Shares)
                  </label>
                  <div className="text-xs text-slate-400">
                    Available: {position.shares} shares
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="border-0 bg-transparent text-xl p-0 h-auto focus:ring-0 focus:ring-offset-0 font-medium text-white"
                      />
                      <div className="text-sm text-slate-400 mt-1">
                        ≈ ${((parseFloat(amount || '0') * parseFloat(position.value.replace(/[$,]/g, '')) / parseFloat(position.shares)) || 0).toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <TrendingDown className="h-3 w-3 text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-white">Shares</span>
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
                        className="h-7 px-2 text-xs border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        {percentage === 100 ? 'MAX' : `${percentage}%`}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expected Output */}
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-2 bg-slate-800/70 rounded-full border border-slate-700">
                    <ArrowDownUp className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-3">
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
                      <div className="text-xl font-medium text-white">
                        {isCalculating ? '...' : `$${expectedAmount}`}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        USDC
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <DollarSign className="h-3 w-3 text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-white">USDC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Time Notice */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center text-sm text-slate-400">
                  <TrendingDown className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">Processing Time</p>
                    <p className="text-xs mt-1">
                      Your withdrawal will be processed within {strategy.timeToWithdraw || '72 hours'}. A small fee (0.5%) applies.
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
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Withdrawing</span>
                    <div className="flex items-center">
                      <span className="text-white font-medium mr-2">
                        {amount} shares
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
                        ${expectedAmount}
                      </span>
                      <DollarSign className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-3">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Strategy</span>
                    <span className="text-white">{strategy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Processing Time</span>
                    <span className="text-white">{strategy.timeToWithdraw || '72h'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fee</span>
                    <span className="text-white">0.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Gas</span>
                    <span className="text-white">$1.50</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {currentStep === 'input' && (
                <>
                  {canProceed() ? (
                    <>Ready to withdraw {amount} shares (${expectedAmount} USD)</>
                  ) : (
                    'Enter amount to continue'
                  )}
                </>
              )}
              {currentStep === 'confirm' && (
                <>Ready to confirm {amount} shares withdrawal</>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={currentStep === 'input' ? () => setCurrentStep('confirm') : handleConfirm}
                disabled={currentStep === 'input' && !canProceed()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 'input' ? (
                  <>
                    {!canProceed() && parseFloat(amount || '0') === 0 
                      ? 'Enter an amount'
                      : !canProceed() && parseFloat(amount || '0') > parseFloat(position.shares)
                      ? 'Insufficient shares'
                      : isCalculating
                      ? 'Calculating...'
                      : 'Review Withdrawal'
                    }
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}