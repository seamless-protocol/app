import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { 
  Plus, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Settings, 
  Info,
  Wallet,
  Target,
  Zap,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface Position {
  id: string
  strategy: string
  assetPair: string
  supplied: number
  earned: number
  apy: number
  status: string
}

interface AddFundsModalProps {
  isOpen: boolean
  onClose: () => void
  position: Position | null
}

type TransactionStep = 'input' | 'approve' | 'confirm' | 'pending' | 'success' | 'error'

export function AddFundsModal({ isOpen, onClose, position }: AddFundsModalProps) {
  const [amount, setAmount] = useState('')
  const [currentStep, setCurrentStep] = useState<TransactionStep>('input')
  const [isProcessing, setIsProcessing] = useState(false)
  const [slippage, setSlippage] = useState('0.5')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedToken, setSelectedToken] = useState('USDC')
  const [needsApproval, setNeedsApproval] = useState(true)

  // Mock wallet balances
  const walletBalances = {
    'USDC': 15420.50,
    'USDT': 8930.25,
    'DAI': 12150.75,
    'WETH': 3.2456
  }

  // Mock gas fees
  const gasEstimate = {
    approval: 0.0012,
    deposit: 0.0018,
    totalETH: 0.003,
    totalUSD: 7.85
  }

  const currentBalance = walletBalances[selectedToken as keyof typeof walletBalances] || 0

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setCurrentStep('input')
      setIsProcessing(false)
      setNeedsApproval(true)
    }
  }, [isOpen])

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const setMaxAmount = () => {
    setAmount(currentBalance.toString())
  }

  const setPercentageAmount = (percentage: number) => {
    const calculatedAmount = (currentBalance * percentage / 100)
    setAmount(calculatedAmount.toFixed(6))
  }

  const validateAmount = () => {
    const numAmount = parseFloat(amount)
    if (!amount || numAmount <= 0) return 'Enter an amount'
    if (numAmount > currentBalance) return 'Insufficient balance'
    if (numAmount < 1) return 'Minimum amount is $1'
    return null
  }

  const handleApprove = async () => {
    setCurrentStep('approve')
    setIsProcessing(true)
    
    try {
      // Simulate approval transaction
      await new Promise(resolve => setTimeout(resolve, 3000))
      setNeedsApproval(false)
      setCurrentStep('confirm')
      toast.success('Token approval successful')
    } catch (error) {
      setCurrentStep('error')
      toast.error('Approval failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    setCurrentStep('pending')
    setIsProcessing(true)
    
    try {
      // Simulate deposit transaction
      await new Promise(resolve => setTimeout(resolve, 4000))
      setCurrentStep('success')
      toast.success(`Successfully added $${amount} to position`)
    } catch (error) {
      setCurrentStep('error')
      toast.error('Transaction failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinue = () => {
    const error = validateAmount()
    if (error) {
      toast.error(error)
      return
    }

    if (needsApproval) {
      handleApprove()
    } else {
      setCurrentStep('confirm')
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-6">
            {/* Token Selection */}
            <div className="space-y-2">
              <Label>Select Token</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="bg-dark-elevated border-divider-line">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-divider-line">
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                  <SelectItem value="WETH">WETH</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between text-sm text-dark-muted">
                <span>Balance: {currentBalance.toLocaleString()} {selectedToken}</span>
                <span>~${(currentBalance * 1.00).toLocaleString()}</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount to Add</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="bg-dark-elevated border-divider-line text-lg h-14 pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setMaxAmount}
                    className="h-8 px-3 text-xs border-brand-purple/30 text-brand-purple hover:bg-brand-purple/10"
                  >
                    MAX
                  </Button>
                </div>
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {[25, 50, 75].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => setPercentageAmount(percentage)}
                    className="flex-1 h-8 text-xs border-divider-line hover:border-brand-purple/30"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
              
              {amount && (
                <div className="text-sm text-dark-muted">
                  ≈ ${(parseFloat(amount) * 1.00).toLocaleString()} USD
                </div>
              )}
            </div>

            {/* Position Preview */}
            {amount && (
              <div className="bg-dark-elevated/50 p-4 rounded-xl border border-divider-line">
                <div className="text-sm font-medium text-dark-primary mb-3">Position Preview</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Current Position</span>
                    <span className="text-dark-primary">${position?.supplied.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Adding</span>
                    <span className="text-success-green">+${parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span className="text-dark-primary">New Position</span>
                    <span className="text-dark-primary">
                      ${((position?.supplied || 0) + parseFloat(amount)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between text-dark-muted hover:text-dark-primary"
              >
                <span className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </span>
                <span className="text-xs">Slippage: {slippage}%</span>
              </Button>
              
              {showAdvanced && (
                <div className="bg-dark-elevated/30 p-4 rounded-xl border border-divider-line space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Slippage Tolerance</Label>
                    <div className="flex gap-2">
                      {['0.1', '0.5', '1.0'].map((value) => (
                        <Button
                          key={value}
                          variant={slippage === value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSlippage(value)}
                          className="flex-1 h-8 text-xs"
                        >
                          {value}%
                        </Button>
                      ))}
                      <Input
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="w-20 h-8 text-xs text-center"
                        placeholder="Custom"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'approve':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-warning-yellow/20 rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-warning-yellow" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Approve Token Spending</h3>
              <p className="text-dark-muted">
                Allow the Seamless Protocol to spend your {selectedToken}. This is a one-time approval.
              </p>
            </div>
            <div className="bg-dark-elevated/50 p-4 rounded-xl">
              <div className="text-sm text-dark-muted mb-2">Approving</div>
              <div className="text-lg font-semibold text-dark-primary">{amount} {selectedToken}</div>
            </div>
            {isProcessing && (
              <div className="space-y-2">
                <Progress value={66} className="h-2" />
                <p className="text-sm text-dark-muted">Waiting for approval confirmation...</p>
              </div>
            )}
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-brand-purple" />
              </div>
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Confirm Transaction</h3>
              <p className="text-dark-muted">Review your transaction details before confirming</p>
            </div>

            <div className="bg-dark-elevated/50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Adding to Position</span>
                <span className="text-dark-primary font-medium">{amount} {selectedToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Strategy</span>
                <span className="text-dark-primary">{position?.strategy}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Current APY</span>
                <span className="text-warning-yellow font-medium">{position?.apy}%</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Network Fee</span>
                <span className="text-dark-primary">${gasEstimate.totalUSD}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Slippage Tolerance</span>
                <span className="text-dark-primary">{slippage}%</span>
              </div>
            </div>
          </div>
        )

      case 'pending':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-brand-purple animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Transaction Pending</h3>
              <p className="text-dark-muted">Adding ${amount} to your position...</p>
            </div>
            <div className="space-y-2">
              <Progress value={75} className="h-2" />
              <p className="text-sm text-dark-muted">This usually takes 30-60 seconds</p>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-success-green/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success-green" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Transaction Successful!</h3>
              <p className="text-dark-muted">Successfully added ${amount} to your position</p>
            </div>
            <div className="bg-dark-elevated/50 p-4 rounded-xl">
              <div className="text-sm text-dark-muted mb-1">New Position Value</div>
              <div className="text-xl font-semibold text-success-green">
                ${((position?.supplied || 0) + parseFloat(amount)).toLocaleString()}
              </div>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-error-red/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-error-red" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Transaction Failed</h3>
              <p className="text-dark-muted">Your transaction was not completed. Please try again.</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderFooterButtons = () => {
    switch (currentStep) {
      case 'input':
        const error = validateAmount()
        return (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-divider-line"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleContinue}
              disabled={!!error || !amount}
              className="flex-1"
            >
              {needsApproval ? 'Approve & Add' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )

      case 'approve':
        return (
          <Button
            variant="gradient"
            onClick={handleApprove}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Approving...' : 'Approve Token'}
            <Zap className="h-4 w-4 ml-2" />
          </Button>
        )

      case 'confirm':
        return (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('input')}
              className="flex-1 border-divider-line"
            >
              Back
            </Button>
            <Button
              variant="gradient"
              onClick={handleConfirm}
              className="flex-1"
            >
              Confirm Transaction
              <Check className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )

      case 'pending':
        return (
          <Button variant="outline" disabled className="w-full">
            Transaction Pending...
          </Button>
        )

      case 'success':
        return (
          <Button variant="gradient" onClick={onClose} className="w-full">
            Done
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )

      case 'error':
        return (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-divider-line"
            >
              Close
            </Button>
            <Button
              variant="gradient"
              onClick={() => setCurrentStep('input')}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  if (!position) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-dark-card border-divider-line">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-dark-primary">
            <Plus className="h-5 w-5 text-success-green" />
            <span>Add Funds</span>
          </DialogTitle>
          <DialogDescription className="text-dark-muted">
            Add additional funds to your active position. Select a token, enter the amount, and confirm the transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Position Info */}
          <div className="bg-dark-elevated/30 p-3 rounded-lg">
            <div className="text-sm text-dark-muted">Adding to</div>
            <div className="font-medium text-dark-primary">{position.strategy}</div>
            <div className="text-xs text-dark-muted">{position.assetPair}</div>
          </div>

          {renderStepContent()}
          {renderFooterButtons()}
        </div>
      </DialogContent>
    </Dialog>
  )
}