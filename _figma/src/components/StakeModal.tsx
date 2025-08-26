import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { Alert, AlertDescription } from "./ui/alert"
import { Progress } from "./ui/progress"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { motion, AnimatePresence } from "motion/react"
import { 
  Coins,
  Check, 
  AlertCircle, 
  ExternalLink,
  ArrowRight,
  RefreshCw,
  X,
  Fuel,
  Clock,
  Info,
  Calculator,
  TrendingUp,
  Shield,
  Sparkles,
  CircleCheck
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface StakeModalProps {
  isOpen: boolean
  onClose: () => void
  poolId?: string | null
}

type StakeStep = 'input' | 'approval' | 'confirm' | 'transaction' | 'success' | 'error'

export function StakeModal({ isOpen, onClose, poolId }: StakeModalProps) {
  // Mock data - in a real app, this would be fetched based on poolId
  const mode: 'stake' | 'unstake' = 'stake' // Default to stake mode
  const currentBalance = {
    seam: '15,234.56',
    esSeam: '8,765.43',
    stakedAmount: '25,000.00'
  }
  const [amount, setAmount] = useState("")
  const [currentStep, setCurrentStep] = useState<StakeStep>('input')
  const [transactionHash, setTransactionHash] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [needsApproval, setNeedsApproval] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState("0.0035")
  const [transactionStep, setTransactionStep] = useState(0)
  const [slippageTolerance, setSlippageTolerance] = useState("0.5")

  // Mock data for calculations
  const currentPrice = 15.68 // USD per SEAM
  const exchangeRate = 1 // 1 SEAM = 1 esSEAM for staking
  const estimatedApy = "24.5"
  const cooldownPeriod = "7 days"

  // Get available balance based on mode
  const availableBalance = mode === 'stake' ? currentBalance.seam : currentBalance.esSeam
  const tokenSymbol = mode === 'stake' ? 'SEAM' : 'esSEAM'
  const receiveSymbol = mode === 'stake' ? 'esSEAM' : 'SEAM'

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setAmount("")
      setCurrentStep('input')
      setTransactionHash("")
      setError("")
      setTransactionStep(0)
      // Check if approval is needed (simulate)
      setNeedsApproval(mode === 'stake' && Math.random() > 0.5)
    }
  }, [isOpen, mode])

  // Calculate derived values
  const amountNumber = parseFloat(amount) || 0
  const usdValue = (amountNumber * currentPrice).toFixed(2)
  const receiveAmount = (amountNumber * exchangeRate).toFixed(6)
  const estimatedYearlyRewards = (amountNumber * parseFloat(estimatedApy) / 100).toFixed(4)

  // Validation
  const isAmountValid = amountNumber > 0 && amountNumber <= parseFloat(availableBalance)
  const hasInsufficientBalance = amountNumber > parseFloat(availableBalance)

  const handlePercentageClick = (percentage: number) => {
    const calculatedAmount = (parseFloat(availableBalance) * percentage / 100).toFixed(6)
    setAmount(calculatedAmount)
  }

  const handleMaxClick = () => {
    setAmount(availableBalance)
  }

  const handleApproval = async () => {
    setCurrentStep('approval')
    setTransactionStep(1)

    try {
      // Simulate approval transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate random failure (5% chance)
      if (Math.random() < 0.05) {
        throw new Error("Approval transaction failed")
      }

      setCurrentStep('confirm')
      setTransactionStep(0)
      
      toast.success("Approval successful!", {
        description: `You can now stake your ${tokenSymbol} tokens`
      })
    } catch (err: any) {
      setCurrentStep('error')
      setError(err.message)
    }
  }

  const handleStakeTransaction = async () => {
    setCurrentStep('transaction')
    setTransactionStep(1)

    try {
      // Step 1: Preparing transaction
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTransactionStep(2)

      // Step 2: Estimating gas
      await new Promise(resolve => setTimeout(resolve, 800))
      setTransactionStep(3)

      // Step 3: Waiting for wallet signature
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTransactionStep(4)

      // Simulate random failure (5% chance)
      if (Math.random() < 0.05) {
        throw new Error("Transaction failed: Network congestion")
      }

      // Step 4: Broadcasting transaction
      await new Promise(resolve => setTimeout(resolve, 1500))
      setTransactionStep(5)

      // Step 5: Confirming transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockTxHash = "0x" + Math.random().toString(16).substr(2, 40)
      setTransactionHash(mockTxHash)
      setCurrentStep('success')
      
      toast.success(`${mode === 'stake' ? 'Staking' : 'Unstaking'} successful!`, {
        description: `${mode === 'stake' ? 'Staked' : 'Unstaked'} ${amount} ${tokenSymbol}`,
        action: {
          label: "View Transaction",
          onClick: () => window.open(`#${mockTxHash}`, "_blank")
        }
      })

    } catch (err: any) {
      setCurrentStep('error')
      setError(err.message)
    }
  }

  const handleRetry = () => {
    if (currentStep === 'error' && needsApproval) {
      setCurrentStep('approval')
    } else if (currentStep === 'error') {
      setCurrentStep('confirm')
    }
    setError("")
    setTransactionStep(0)
  }

  const getTransactionStepText = () => {
    switch (transactionStep) {
      case 1: return `Preparing ${mode} transaction...`
      case 2: return "Estimating gas costs..."
      case 3: return "Waiting for wallet signature..."
      case 4: return "Broadcasting transaction..."
      case 5: return "Confirming transaction..."
      default: return "Starting..."
    }
  }

  const handleClose = () => {
    setCurrentStep('input')
    setAmount("")
    setError("")
    setTransactionHash("")
    setTransactionStep(0)
    onClose()
  }

  // Error State
  if (currentStep === 'error') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Transaction Failed</DialogTitle>
            <DialogDescription>An error occurred during the transaction</DialogDescription>
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
              Transaction Failed
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
            <DialogTitle>Transaction Successful</DialogTitle>
            <DialogDescription>Your transaction has been completed successfully</DialogDescription>
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
              {mode === 'stake' ? 'Staking' : 'Unstaking'} Complete!
            </motion.h2>
            
            <motion.div 
              className="bg-slate-800/50 rounded-lg p-3 mb-4 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{mode === 'stake' ? 'Staked' : 'Unstaked'}</span>
                <span className="text-white font-medium">{amount} {tokenSymbol}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Received</span>
                <span className="text-green-400 font-medium">{receiveAmount} {receiveSymbol}</span>
              </div>
              
              <Separator className="my-2 bg-slate-700" />
              
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-400">USD Value</span>
                <span className="text-green-400 text-lg">${usdValue}</span>
              </div>
            </motion.div>
            
            <motion.div
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Done
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`#${transactionHash}`, "_blank")}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Tx
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Transaction Processing State
  if (currentStep === 'transaction' || currentStep === 'approval') {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Processing Transaction</DialogTitle>
            <DialogDescription>Your transaction is being processed</DialogDescription>
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
              {currentStep === 'approval' ? 'Approving Token' : `Processing ${mode === 'stake' ? 'Staking' : 'Unstaking'}`}
            </h2>
            
            <div className="mb-3 px-4">
              <Progress 
                value={(transactionStep / 5) * 100} 
                className="h-2 bg-slate-800"
              />
            </div>
            
            <motion.p 
              className="text-slate-400 mb-2"
              key={transactionStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {getTransactionStepText()}
            </motion.p>
            
            {transactionStep === 2 && (
              <div className="flex items-center justify-center text-xs text-slate-500">
                <Fuel className="h-3 w-3 mr-1" />
                Estimated gas: {estimatedGas} ETH
              </div>
            )}
            
            <div className="mt-4 text-xs text-slate-500">
              Step {transactionStep} of 5
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-2xl max-h-[85vh] overflow-hidden backdrop-blur-sm">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center space-x-3 text-white">
            <div className="w-7 h-7 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Coins className="h-4 w-4 text-white" />
            </div>
            <span>{mode === 'stake' ? 'Stake SEAM' : 'Unstake esSEAM'}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === 'stake' 
              ? 'Stake your SEAM tokens to earn protocol rewards and governance rights'
              : `Unstake your esSEAM tokens (${cooldownPeriod} cooldown period applies)`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Amount Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="stake-amount" className="text-white font-medium text-sm">
                Amount to {mode}
              </Label>
              <div className="text-xs text-slate-400">
                Available: <Button variant="link" onClick={handleMaxClick} className="p-0 h-auto text-purple-400 underline text-xs">
                  {availableBalance} {tokenSymbol}
                </Button>
              </div>
            </div>
            
            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-slate-700 overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      id="stake-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`text-xl font-semibold bg-transparent border-none text-white placeholder:text-slate-500 pr-16 ${
                        hasInsufficientBalance ? 'text-red-400' : ''
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                        {tokenSymbol}
                      </Badge>
                    </div>
                  </div>
                  
                  {amount && (
                    <div className="text-base text-slate-400">
                      ≈ ${usdValue} USD
                    </div>
                  )}
                  
                  {hasInsufficientBalance && (
                    <Alert className="border-red-500/30 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-400 text-sm">
                        Insufficient {tokenSymbol} balance. Available: {availableBalance} {tokenSymbol}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Percentage Selectors */}
            <div className="flex space-x-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePercentageClick(percentage)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-purple-500 hover:text-purple-400 text-xs h-8"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>

          {/* Transaction Preview */}
          {amount && isAmountValid && (
            <Card className="bg-slate-800/70 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-white text-base">
                  <Calculator className="h-4 w-4 text-purple-400" />
                  <span>Transaction Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">You {mode === 'stake' ? 'stake' : 'unstake'}</p>
                    <p className="font-medium text-white text-sm">{amount} {tokenSymbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">You receive</p>
                    <p className="font-medium text-green-400 text-sm">{receiveAmount} {receiveSymbol}</p>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exchange Rate</span>
                    <span className="text-slate-300">1 {tokenSymbol} = {exchangeRate} {receiveSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Network Fee</span>
                    <div className="flex items-center text-slate-300 bg-slate-800 px-2 py-1 rounded">
                      <Fuel className="h-3 w-3 mr-1" />
                      ~{estimatedGas} ETH
                    </div>
                  </div>
                  {mode === 'stake' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Est. Annual Rewards</span>
                      <span className="text-green-400">{estimatedYearlyRewards} {tokenSymbol} ({estimatedApy}% APY)</span>
                    </div>
                  )}
                  {mode === 'unstake' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cooldown Period</span>
                      <span className="text-yellow-400">{cooldownPeriod}</span>
                    </div>
                  )}
                </div>

                {mode === 'stake' && (
                  <Alert className="bg-cyan-500/10 border-cyan-500/20">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    <AlertDescription className="text-slate-400 text-sm">
                      Staked tokens earn rewards continuously and can be used for governance voting.
                    </AlertDescription>
                  </Alert>
                )}

                {mode === 'unstake' && (
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-slate-400 text-sm">
                      Unstaking requires a {cooldownPeriod} cooldown period. You will not earn rewards during this time.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {isAmountValid ? (
                <>Ready to {mode} {amount} {tokenSymbol} (${usdValue} USD)</>
              ) : (
                'Enter amount to continue'
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
                onClick={needsApproval && currentStep === 'input' ? handleApproval : handleStakeTransaction}
                disabled={!isAmountValid}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {needsApproval && currentStep === 'input' ? (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Approve {tokenSymbol}
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    {mode === 'stake' ? 'Stake' : 'Unstake'} {tokenSymbol}
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