import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Slider } from "./ui/slider"
import { 
  Minus, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Info,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  ArrowDownRight,
  Wallet
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

interface RemoveFundsModalProps {
  isOpen: boolean
  onClose: () => void
  position: Position | null
}

type TransactionStep = 'input' | 'confirm' | 'pending' | 'success' | 'error'

export function RemoveFundsModal({ isOpen, onClose, position }: RemoveFundsModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPercentage, setWithdrawPercentage] = useState([0])
  const [currentStep, setCurrentStep] = useState<TransactionStep>('input')
  const [isProcessing, setIsProcessing] = useState(false)
  const [emergencyExit, setEmergencyExit] = useState(false)

  const totalValue = (position?.supplied || 0) + (position?.earned || 0)
  
  // Mock withdrawal fees and impact
  const withdrawalFee = 0.1 // 0.1%
  const gasEstimate = {
    withdraw: 0.0015,
    totalUSD: 6.25
  }

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setWithdrawAmount('')
      setWithdrawPercentage([0])
      setCurrentStep('input')
      setIsProcessing(false)
      setEmergencyExit(false)
    }
  }, [isOpen])

  // Update amount when slider changes
  useEffect(() => {
    const percentage = withdrawPercentage[0]
    const calculatedAmount = (totalValue * percentage / 100)
    setWithdrawAmount(calculatedAmount.toFixed(6))
  }, [withdrawPercentage, totalValue])

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value)
      // Update slider to match amount
      const percentage = totalValue > 0 ? (parseFloat(value) / totalValue) * 100 : 0
      setWithdrawPercentage([Math.min(Math.max(percentage, 0), 100)])
    }
  }

  const setMaxAmount = () => {
    setWithdrawAmount(totalValue.toString())
    setWithdrawPercentage([100])
  }

  const setPercentageAmount = (percentage: number) => {
    const calculatedAmount = (totalValue * percentage / 100)
    setWithdrawAmount(calculatedAmount.toFixed(6))
    setWithdrawPercentage([percentage])
  }

  const validateAmount = () => {
    const numAmount = parseFloat(withdrawAmount)
    if (!withdrawAmount || numAmount <= 0) return 'Enter an amount'
    if (numAmount > totalValue) return 'Amount exceeds position value'
    if (numAmount < 1) return 'Minimum withdrawal is $1'
    return null
  }

  const calculateWithdrawalFee = () => {
    const numAmount = parseFloat(withdrawAmount) || 0
    return numAmount * (withdrawalFee / 100)
  }

  const calculateReceiveAmount = () => {
    const numAmount = parseFloat(withdrawAmount) || 0
    const fee = calculateWithdrawalFee()
    return numAmount - fee
  }

  const calculateRemainingPosition = () => {
    return totalValue - (parseFloat(withdrawAmount) || 0)
  }

  const handleConfirm = async () => {
    setCurrentStep('pending')
    setIsProcessing(true)
    
    try {
      // Simulate withdrawal transaction
      await new Promise(resolve => setTimeout(resolve, 4000))
      setCurrentStep('success')
      toast.success(`Successfully withdrew $${withdrawAmount} from position`)
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
    setCurrentStep('confirm')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-6">
            {/* Position Summary */}
            <div className="bg-dark-elevated/50 p-4 rounded-xl border border-divider-line">
              <div className="text-sm font-medium text-dark-primary mb-3">Current Position</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-dark-muted">Principal</div>
                  <div className="text-dark-primary font-medium">${position?.supplied.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-dark-muted">Earnings</div>
                  <div className="text-success-green font-medium">+${position?.earned.toFixed(2)}</div>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between">
                <span className="text-dark-muted">Total Available</span>
                <span className="text-lg font-semibold text-dark-primary">${totalValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Withdrawal Amount */}
            <div className="space-y-4">
              <Label>Withdrawal Amount</Label>
              
              {/* Percentage Slider */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-dark-muted">
                  <span>0%</span>
                  <span className="text-dark-primary font-medium">{withdrawPercentage[0].toFixed(1)}%</span>
                  <span>100%</span>
                </div>
                <Slider
                  value={withdrawPercentage}
                  onValueChange={setWithdrawPercentage}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Amount Input */}
              <div className="relative">
                <Input
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="bg-dark-elevated border-divider-line text-lg h-14 pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setMaxAmount}
                    className="h-8 px-3 text-xs border-error-red/30 text-error-red hover:bg-error-red/10"
                  >
                    MAX
                  </Button>
                </div>
              </div>
              
              {/* Quick Percentage Buttons */}
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((percentage) => (
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
            </div>

            {/* Withdrawal Impact */}
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="bg-dark-elevated/50 p-4 rounded-xl border border-divider-line space-y-3">
                <div className="text-sm font-medium text-dark-primary">Withdrawal Summary</div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Withdrawal Amount</span>
                    <span className="text-dark-primary">${parseFloat(withdrawAmount).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Withdrawal Fee ({withdrawalFee}%)</span>
                    <span className="text-error-red">-${calculateWithdrawalFee().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Network Fee</span>
                    <span className="text-dark-primary">${gasEstimate.totalUSD}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span className="text-dark-primary">You'll Receive</span>
                    <span className="text-success-green">${calculateReceiveAmount().toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Remaining Position</span>
                    <span className="text-dark-primary">${calculateRemainingPosition().toLocaleString()}</span>
                  </div>
                </div>

                {/* Warning for large withdrawals */}
                {withdrawPercentage[0] > 80 && (
                  <div className="bg-warning-yellow/10 border border-warning-yellow/30 p-3 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-warning-yellow mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-warning-yellow">
                        <div className="font-medium">Large Withdrawal Warning</div>
                        <div>Withdrawing {withdrawPercentage[0].toFixed(1)}% will significantly reduce your earning potential.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Emergency Exit Option */}
            <div className="bg-error-red/5 border border-error-red/20 p-4 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-error-red mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-error-red mb-1">Emergency Exit</div>
                  <div className="text-xs text-dark-muted mb-3">
                    Close entire position immediately. May result in higher fees and slippage.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmergencyExit(true)
                      setMaxAmount()
                    }}
                    className="border-error-red/30 text-error-red hover:bg-error-red/10 h-8"
                  >
                    Emergency Exit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-error-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowDownRight className="h-8 w-8 text-error-red" />
              </div>
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Confirm Withdrawal</h3>
              <p className="text-dark-muted">Review your withdrawal details before confirming</p>
            </div>

            <div className="bg-dark-elevated/50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Withdrawing from</span>
                <span className="text-dark-primary font-medium">{position?.strategy}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Withdrawal Amount</span>
                <span className="text-dark-primary font-medium">${parseFloat(withdrawAmount).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Withdrawal Fee</span>
                <span className="text-error-red">-${calculateWithdrawalFee().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Network Fee</span>
                <span className="text-dark-primary">${gasEstimate.totalUSD}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span className="text-dark-primary">You'll Receive</span>
                <span className="text-success-green">${calculateReceiveAmount().toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Remaining Position</span>
                <span className="text-dark-primary">${calculateRemainingPosition().toLocaleString()}</span>
              </div>
            </div>

            {emergencyExit && (
              <div className="bg-error-red/10 border border-error-red/30 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-error-red">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Emergency Exit Mode</span>
                </div>
                <div className="text-xs text-dark-muted mt-1">
                  This will close your entire position immediately.
                </div>
              </div>
            )}
          </div>
        )

      case 'pending':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-error-red/20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-error-red animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Processing Withdrawal</h3>
              <p className="text-dark-muted">Withdrawing ${parseFloat(withdrawAmount).toLocaleString()} from your position...</p>
            </div>
            <div className="space-y-2">
              <Progress value={60} className="h-2" />
              <p className="text-sm text-dark-muted">This usually takes 45-90 seconds</p>
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
              <h3 className="text-lg font-semibold text-dark-primary mb-2">Withdrawal Successful!</h3>
              <p className="text-dark-muted">Your funds have been transferred to your wallet</p>
            </div>
            <div className="bg-dark-elevated/50 p-4 rounded-xl space-y-2">
              <div className="text-sm text-dark-muted">Received</div>
              <div className="text-xl font-semibold text-success-green">
                ${calculateReceiveAmount().toLocaleString()}
              </div>
              {calculateRemainingPosition() > 0 && (
                <>
                  <div className="text-sm text-dark-muted mt-3">Remaining Position</div>
                  <div className="text-lg font-semibold text-dark-primary">
                    ${calculateRemainingPosition().toLocaleString()}
                  </div>
                </>
              )}
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
              <p className="text-dark-muted">Your withdrawal was not completed. Please try again.</p>
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
              variant="outline"
              onClick={handleContinue}
              disabled={!!error || !withdrawAmount}
              className="flex-1 border-error-red/30 text-error-red hover:bg-error-red/10"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
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
              variant="outline"
              onClick={handleConfirm}
              className="flex-1 border-error-red/30 text-error-red hover:bg-error-red/10"
            >
              Confirm Withdrawal
              <Check className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )

      case 'pending':
        return (
          <Button variant="outline" disabled className="w-full">
            Processing Withdrawal...
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
              variant="outline"
              onClick={() => setCurrentStep('input')}
              className="flex-1 border-error-red/30 text-error-red hover:bg-error-red/10"
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
            <Minus className="h-5 w-5 text-error-red" />
            <span>Remove Funds</span>
          </DialogTitle>
          <DialogDescription className="text-dark-muted">
            Withdraw funds from your active position. Choose an amount or percentage, review fees, and confirm the withdrawal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Position Info */}
          <div className="bg-dark-elevated/30 p-3 rounded-lg">
            <div className="text-sm text-dark-muted">Withdrawing from</div>
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