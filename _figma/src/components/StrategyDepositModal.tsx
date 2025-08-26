"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { motion, AnimatePresence } from "motion/react"
import { 
  X, 
  ArrowDownUp, 
  Settings, 
  Info, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  ExternalLink,
  Percent,
  RefreshCw,
  TrendingUp,
  Zap,
  Sparkles,
  CircleCheck,
  DollarSign
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  icon: string
}

interface Strategy {
  id: string
  name: string
  description: string
  apy: string
  tvl: string
  riskLevel: string
  minDeposit: string
}

interface StrategyDepositModalProps {
  isOpen: boolean
  onClose: () => void
  strategyId?: string | null
}

type DepositStep = 'input' | 'approve' | 'confirm' | 'pending' | 'success' | 'error'

export function StrategyDepositModal({ isOpen, onClose, strategyId }: StrategyDepositModalProps) {
  // Mock data - in a real app, this would be fetched based on strategyId
  const strategy: Strategy = {
    id: strategyId || 'eth-usdc-leverage',
    name: 'ETH-USDC Leverage Strategy',
    description: 'Automated leveraged lending strategy',
    apy: '12.34',
    tvl: '$24.2M',
    riskLevel: 'Medium',
    minDeposit: '100 USDC'
  }
  const [currentStep, setCurrentStep] = useState<DepositStep>('input')
  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '1,250.45',
    price: 1.00,
    icon: '💵'
  })
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [expectedShares, setExpectedShares] = useState('0')
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')

  // Available tokens for deposit
  const availableTokens: Token[] = [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '1,250.45',
      price: 1.00,
      icon: '💵'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      balance: '850.20',
      price: 1.00,
      icon: '💚'
    },
    {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      balance: '2,100.75',
      price: 0.999,
      icon: '🟡'
    }
  ]

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('input')
      setAmount('')
      setError('')
      setTransactionHash('')
      setExpectedShares('0')
    }
  }, [isOpen])

  // Calculate expected shares based on input amount
  const calculateExpectedShares = useCallback(async (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setExpectedShares('0')
      return
    }

    setIsCalculating(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const input = parseFloat(inputAmount)
      // Mock calculation: 1 USDC = ~0.995 shares (accounting for fees)
      const shares = input * 0.995
      setExpectedShares(shares.toFixed(6))
    } catch (error) {
      console.error('Failed to calculate shares:', error)
      setExpectedShares('0')
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
      calculateExpectedShares(value)
    }
  }

  // Handle percentage shortcuts
  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(selectedToken.balance.replace(/,/g, ''))
    const newAmount = (balance * percentage / 100).toFixed(6)
    setAmount(newAmount)
    calculateExpectedShares(newAmount)
  }

  // Validate deposit
  const canProceed = () => {
    const inputAmount = parseFloat(amount)
    const balance = parseFloat(selectedToken.balance.replace(/,/g, ''))
    const minDeposit = parseFloat(strategy.minDeposit.split(' ')[0])
    
    return inputAmount > 0 && 
           inputAmount <= balance && 
           inputAmount >= minDeposit && 
           !isCalculating &&
           parseFloat(expectedShares) > 0
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

  // Handle deposit confirmation
  const handleConfirm = async () => {
    setCurrentStep('pending')
    
    try {
      // Simulate deposit transaction
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Mock transaction hash
      const mockHash = '0x' + Math.random().toString(16).substr(2, 64)
      setTransactionHash(mockHash)
      
      toast.success('Deposit successful!', {
        description: `${amount} ${selectedToken.symbol} deposited to ${strategy.name}`
      })
      
      setCurrentStep('success')
    } catch (error) {
      setError('Deposit failed. Please try again.')
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

  // Error State
  if (currentStep === 'error') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Transaction Failed</DialogTitle>
            <DialogDescription>An error occurred during the deposit transaction</DialogDescription>
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
              Deposit Failed
            </motion.h2>
            
            <motion.p 
              className="text-slate-400 mb-4 text-sm leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {error}
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
            <DialogTitle>Deposit Successful</DialogTitle>
            <DialogDescription>Your deposit has been completed successfully</DialogDescription>
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
              Deposit Successful!
            </motion.h2>
            
            <motion.p 
              className="text-slate-400 mb-4 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Your {amount} {selectedToken.symbol} has been successfully deposited into {strategy.name}.
            </motion.p>
            
            <motion.div 
              className="bg-slate-800/50 rounded-lg p-3 mb-4 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Deposited</span>
                <span className="text-white font-medium">{amount} {selectedToken.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Received</span>
                <span className="text-green-400 font-medium">{expectedShares} shares</span>
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
              className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <div className="flex items-start text-sm">
                <TrendingUp className="h-4 w-4 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-cyan-400">
                  <p className="font-medium">Start earning immediately!</p>
                  <p className="text-xs mt-1 opacity-90">
                    Your deposit is now earning {strategy.apy}% APY. Track your earnings in the Portfolio tab.
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
  if (currentStep === 'pending' || currentStep === 'approve') {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Processing Transaction</DialogTitle>
            <DialogDescription>Your deposit transaction is being processed</DialogDescription>
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
              {currentStep === 'approve' ? 'Approve Token Spending' : 'Processing Deposit'}
            </h2>
            
            <p className="text-slate-400 text-center max-w-sm mb-4">
              {currentStep === 'approve' 
                ? `Approve the contract to spend your ${selectedToken.symbol}. This is a one-time approval for this token.`
                : 'Your deposit is being processed. This may take a few moments.'
              }
            </p>
            
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {currentStep === 'approve' ? 'Token' : 'Amount'}
                  </span>
                  <span className="text-white">
                    {currentStep === 'approve' ? selectedToken.symbol : `${amount} ${selectedToken.symbol}`}
                  </span>
                </div>
                {currentStep === 'approve' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount to approve</span>
                    <span className="text-white">{amount} {selectedToken.symbol}</span>
                  </div>
                )}
                {currentStep === 'pending' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Strategy</span>
                      <span className="text-white">{strategy.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className="text-yellow-400">Confirming...</span>
                    </div>
                  </>
                )}
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
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span>{currentStep === 'confirm' ? 'Confirm Deposit' : 'Deposit to Strategy'}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {currentStep === 'confirm' 
              ? 'Review your deposit details and confirm the transaction'
              : `Deposit your tokens into ${strategy.name} to start earning ${strategy.apy}% APY`
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
                <span>Step {
                  currentStep === 'input' ? '1' : 
                  currentStep === 'approve' ? '2' : 
                  currentStep === 'confirm' ? '3' : '4'
                } of 4</span>
                <span className="capitalize">{currentStep}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4 overflow-auto">
          {/* Render step content */}
          {currentStep === 'input' && (
            <div className="space-y-4">
              {/* Token Selection and Amount Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">
                    Deposit Amount
                  </label>
                  <div className="text-xs text-slate-400">
                    Balance: {selectedToken.balance} {selectedToken.symbol}
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
                        className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 text-white"
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
                          className="h-7 px-2 text-xs border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                          {percentage === 100 ? 'MAX' : `${percentage}%`}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-slate-400 hover:text-white text-xs h-7"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Advanced
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    className="bg-slate-800/70 border border-slate-700 rounded-lg p-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
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
                            className={`h-7 px-2 text-xs ${
                              slippage === value
                                ? 'bg-purple-600 text-white hover:bg-purple-500'
                                : 'border-slate-600 text-slate-300 hover:bg-slate-800'
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
                            className="w-14 h-7 text-xs text-center bg-slate-800 border-slate-600"
                            placeholder="0.5"
                          />
                          <Percent className="h-3 w-3 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                        {isCalculating ? '...' : expectedShares}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Vault Shares
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-3 w-3 text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-white">
                        {strategy.name.split(' ')[0]} Shares
                      </span>
                    </div>
                  </div>

                  {/* Earnings Projection */}
                  {parseFloat(expectedShares) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Projected Monthly Earnings</span>
                        <div className="flex items-center text-green-400">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          ${((parseFloat(expectedShares) * parseFloat(strategy.apy)) / 100 / 12).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-3">Transaction Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Deposit Amount</span>
                    <span className="text-white">{amount || '0'} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Strategy APY</span>
                    <span className="text-green-400">{strategy.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Management Fee</span>
                    <span className="text-white">0.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slippage Tolerance</span>
                    <span className="text-white">{slippage}%</span>
                  </div>
                  <Separator className="my-2 bg-slate-700" />
                  <div className="flex justify-between font-medium">
                    <span className="text-white">You will receive</span>
                    <span className="text-white">{expectedShares} shares</span>
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
                    <span className="text-slate-400 text-sm">Depositing</span>
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
                        {expectedShares} shares
                      </span>
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-3">Final Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Strategy</span>
                    <span className="text-white">{strategy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current APY</span>
                    <span className="text-green-400">{strategy.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Gas</span>
                    <span className="text-white">$2.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Cost</span>
                    <span className="text-white">
                      {amount} {selectedToken.symbol} + Gas
                    </span>
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
                    <>Ready to deposit {amount} {selectedToken.symbol} (${(parseFloat(amount || '0') * selectedToken.price).toFixed(2)} USD)</>
                  ) : (
                    'Enter amount to continue'
                  )}
                </>
              )}
              {currentStep === 'confirm' && (
                <>Ready to confirm {amount} {selectedToken.symbol} deposit</>
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
                onClick={currentStep === 'input' ? handleApprove : handleConfirm}
                disabled={currentStep === 'input' && !canProceed()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 'input' ? (
                  <>
                    {!canProceed() && parseFloat(amount || '0') === 0 
                      ? 'Enter an amount'
                      : !canProceed() && parseFloat(amount || '0') > parseFloat(selectedToken.balance.replace(/,/g, ''))
                      ? 'Insufficient balance'
                      : !canProceed() && parseFloat(amount || '0') < parseFloat(strategy.minDeposit.split(' ')[0])
                      ? `Minimum deposit: ${strategy.minDeposit}`
                      : isCalculating
                      ? 'Calculating...'
                      : `Approve ${selectedToken.symbol}`
                    }
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Confirm Deposit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}