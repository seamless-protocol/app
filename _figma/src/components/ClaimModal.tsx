"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Alert, AlertDescription } from "./ui/alert"
import { Progress } from "./ui/progress"
import { ScrollArea } from "./ui/scroll-area"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Separator } from "./ui/separator"
import { 
  Gift,
  ExternalLink, 
  Check, 
  AlertCircle, 
  Copy,
  TrendingUp,
  Clock,
  Coins,
  Zap,
  History,
  X,
  RefreshCw,
  Fuel,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Lock,
  Award,
  Sparkles,
  CircleCheck,
  Info,
  ArrowUpRight
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface ClaimableReward {
  id: string // Added unique identifier
  token: string
  symbol: string
  amount: string
  usdValue: string
  source: string
  type: 'immediate' | 'vesting' | 'locked'
  vestingEnd?: string
  lockDuration?: string
  icon?: string
  apr?: string
  nextVest?: string
}

interface ClaimHistory {
  date: string
  tokens: { symbol: string; amount: string; usdValue: string }[]
  txHash: string
  usdValue: string
  gasUsed: string
  status: 'success' | 'pending' | 'failed'
}

interface ClaimModalProps {
  isOpen: boolean
  onClose: () => void
  pendingRewards?: number
}

export function ClaimModal({ isOpen, onClose, pendingRewards = 247.83 }: ClaimModalProps) {
  const context: 'governance' | 'portfolio' = 'portfolio'
  
  // Enhanced mock data with unique IDs
  const rewards: ClaimableReward[] = [
    {
      id: 'seam-staking',
      token: 'SEAM',
      symbol: 'SEAM',
      amount: pendingRewards.toString(),
      usdValue: `${(pendingRewards * 1.23).toFixed(2)}`,
      source: 'Staking Rewards',
      type: 'immediate',
      icon: '🟣',
      apr: '24.5%'
    },
    {
      id: 'esseam-governance',
      token: 'esSeam',
      symbol: 'esSeam',
      amount: (pendingRewards * 0.3).toFixed(2),
      usdValue: `${(pendingRewards * 0.3 * 1.15).toFixed(2)}`,
      source: 'Governance Participation',
      type: 'immediate',
      icon: '🔒',
      apr: '15.2%'
    },
    {
      id: 'seam-fees',
      token: 'SEAM',
      symbol: 'SEAM',
      amount: '45.67',
      usdValue: '56.17',
      source: 'Protocol Fees',
      type: 'vesting',
      vestingEnd: '2024-03-15',
      nextVest: '12.34 SEAM on Mar 1',
      icon: '⏰'
    },
    {
      id: 'lp-seam-mining',
      token: 'LP-SEAM',
      symbol: 'LP-SEAM',
      amount: '12.34',
      usdValue: '87.45',
      source: 'Liquidity Mining',
      type: 'locked',
      lockDuration: '30 days',
      icon: '🔐'
    }
  ]

  const [selectedRewards, setSelectedRewards] = useState<string[]>([])
  const [isTransacting, setIsTransacting] = useState(false)
  const [transactionStep, setTransactionStep] = useState(0)
  const [transactionComplete, setTransactionComplete] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [autoCompound, setAutoCompound] = useState(false)
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([])
  const [estimatedGas, setEstimatedGas] = useState("0.0035")
  const [selectedTab, setSelectedTab] = useState("claim")

  // Enhanced mock claim history
  const mockClaimHistory: ClaimHistory[] = [
    {
      date: "2024-01-28",
      tokens: [
        { symbol: "SEAM", amount: "125.50", usdValue: "$154.37" },
        { symbol: "esSeam", amount: "67.25", usdValue: "$77.34" }
      ],
      txHash: "0xabc123def456789...",
      usdValue: "$231.71",
      gasUsed: "0.0042",
      status: 'success'
    },
    {
      date: "2024-01-21",
      tokens: [
        { symbol: "SEAM", amount: "89.75", usdValue: "$110.45" }
      ],
      txHash: "0xdef456abc123789...",
      usdValue: "$110.45",
      gasUsed: "0.0038",
      status: 'success'
    },
    {
      date: "2024-01-15",
      tokens: [
        { symbol: "SEAM", amount: "234.80", usdValue: "$289.01" },
        { symbol: "esSeam", amount: "45.23", usdValue: "$52.01" }
      ],
      txHash: "0x789abc456def123...",
      usdValue: "$341.02",
      gasUsed: "0.0051",
      status: 'success'
    }
  ]

  useEffect(() => {
    if (isOpen) {
      setClaimHistory(mockClaimHistory)
      // Auto-select all immediate rewards using unique IDs
      const immediateRewardIds = rewards.filter(r => r.type === 'immediate').map(r => r.id)
      setSelectedRewards(immediateRewardIds)
      // Reset states
      setTransactionComplete(false)
      setIsTransacting(false)
      setTransactionError(null)
      setTransactionStep(0)
    }
  }, [isOpen])

  const handleRewardToggle = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId)
    if (reward?.type !== 'immediate') return

    setSelectedRewards(prev => 
      prev.includes(rewardId) 
        ? prev.filter(id => id !== rewardId)
        : [...prev, rewardId]
    )
  }

  const handleClaimAll = () => {
    const allClaimable = rewards.filter(r => r.type === 'immediate').map(r => r.id)
    setSelectedRewards(allClaimable)
  }

  const handleClearSelection = () => {
    setSelectedRewards([])
  }

  const handleClaim = async () => {
    setIsTransacting(true)
    setTransactionStep(0)
    setTransactionError(null)

    try {
      // Step 1: Preparing transaction
      setTransactionStep(1)
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Step 2: Estimating gas
      setTransactionStep(2)
      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 3: Waiting for wallet signature
      setTransactionStep(3)
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Simulate random failure for demo (3% chance)
      if (Math.random() < 0.03) {
        throw new Error("Transaction failed: Insufficient gas for execution")
      }

      // Step 4: Broadcasting transaction
      setTransactionStep(4)
      await new Promise(resolve => setTimeout(resolve, 1800))

      // Step 5: Confirming transaction
      setTransactionStep(5)
      await new Promise(resolve => setTimeout(resolve, 2200))

      setTransactionComplete(true)
      
      const claimedTokens = rewards.filter(r => selectedRewards.includes(r.id))
      const totalUsdValue = claimedTokens.reduce((sum, r) => sum + parseFloat(r.usdValue.replace('$', '').replace(',', '')), 0)
      
      toast.success("🎉 Rewards claimed successfully!", {
        description: `Claimed ${claimedTokens.length} reward${claimedTokens.length > 1 ? 's' : ''} worth $${totalUsdValue.toLocaleString()}`,
        action: {
          label: "View Transaction",
          onClick: () => window.open("https://etherscan.io/tx/0x...", "_blank")
        }
      })

      // Auto-close after success animation
      setTimeout(() => {
        onClose()
        setTransactionComplete(false)
        setIsTransacting(false)
        setTransactionStep(0)
        setTransactionError(null)
        setSelectedRewards([])
      }, 3500)

    } catch (error: any) {
      setIsTransacting(false)
      setTransactionStep(0)
      setTransactionError(error.message)
      
      toast.error("Claim failed", {
        description: error.message || "Please try again or check your wallet connection"
      })
    }
  }

  const handleRetryTransaction = () => {
    setTransactionError(null)
    handleClaim()
  }

  const getTransactionStepText = () => {
    switch (transactionStep) {
      case 1: return "Preparing claim transaction..."
      case 2: return "Estimating gas costs..."
      case 3: return "Waiting for wallet signature..."
      case 4: return "Broadcasting to network..."
      case 5: return "Confirming on blockchain..."
      default: return "Starting transaction..."
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const selectedRewardData = rewards.filter(r => selectedRewards.includes(r.id))
  const totalSelectedUsd = selectedRewardData.reduce((sum, r) => sum + parseFloat(r.usdValue.replace('$', '').replace(',', '')), 0)
  const immediateRewards = rewards.filter(r => r.type === 'immediate')
  const totalRewardsUsd = immediateRewards.reduce((sum, r) => sum + parseFloat(r.usdValue.replace('$', '').replace(',', '')), 0)

  // Transaction Error State
  if (transactionError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Claim Failed</DialogTitle>
            <DialogDescription>An error occurred while claiming rewards</DialogDescription>
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
              {transactionError}
            </motion.p>
            
            <motion.div 
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button
                onClick={handleRetryTransaction}
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

  // Transaction Complete State
  if (transactionComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Claim Complete</DialogTitle>
            <DialogDescription>Your rewards have been successfully claimed</DialogDescription>
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
              🎉 Rewards Claimed!
            </motion.h2>
            
            <motion.div 
              className="bg-slate-800/50 rounded-lg p-3 mb-4 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              {selectedRewardData.map((reward, index) => (
                <motion.div 
                  key={reward.id} 
                  className="flex items-center justify-between text-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{reward.icon}</span>
                    <span className="text-slate-300">{reward.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{reward.amount}</div>
                    <div className="text-slate-400 text-xs">${parseFloat(reward.usdValue).toLocaleString()}</div>
                  </div>
                </motion.div>
              ))}
              
              <Separator className="my-2 bg-slate-700" />
              
              <motion.div 
                className="flex items-center justify-between font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <span className="text-slate-300">Total Value</span>
                <span className="text-green-400 text-lg">${totalSelectedUsd.toLocaleString()}</span>
              </motion.div>
            </motion.div>
            
            <motion.div
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.9 }}
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => window.open("https://etherscan.io/tx/0x...", "_blank")}
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
  if (isTransacting) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Processing Claim</DialogTitle>
            <DialogDescription>Your reward claim is being processed</DialogDescription>
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
            
            <h2 className="text-lg font-semibold text-white mb-3">Processing Claim</h2>
            
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
                Estimated gas: {estimatedGas} ETH (~$8.42)
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-3xl max-h-[85vh] overflow-hidden backdrop-blur-sm">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center space-x-3 text-white">
            <div className="w-7 h-7 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Gift className="h-4 w-4 text-white" />
            </div>
            <span>Claim Rewards</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Claim your {context === 'governance' ? 'governance' : 'portfolio'} rewards and view claim history
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 mb-4">
            <TabsTrigger 
              value="claim" 
              className="text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700"
            >
              <Gift className="h-4 w-4 mr-2" />
              Claim Rewards
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700"
            >
              <History className="h-4 w-4 mr-2" />
              Claim History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="claim" className="space-y-4">
            {/* Condensed Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-slate-700 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Total Claimable Value</p>
                      <p className="text-2xl font-bold text-white">${totalRewardsUsd.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Immediate rewards only</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Selected Value</p>
                      <p className="text-xl font-bold text-green-400">${totalSelectedUsd.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{selectedRewards.length} rewards selected</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClaimAll}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-8"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearSelection}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-8"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-compound"
                          checked={autoCompound}
                          onCheckedChange={setAutoCompound}
                          className="scale-90"
                        />
                        <Label htmlFor="auto-compound" className="text-xs text-slate-400">
                          Auto-compound
                        </Label>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                        <Fuel className="h-3 w-3 mr-1" />
                        ~{estimatedGas} ETH
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Condensed Rewards List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white">Available Rewards</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-slate-400 hover:text-white text-xs h-8"
                >
                  {showBreakdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  Details
                </Button>
              </div>

              <ScrollArea className="h-60 pr-4">
                <div className="space-y-2">
                  <AnimatePresence>
                    {rewards.map((reward, index) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: reward.type === 'immediate' ? 1.01 : 1 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-200 border ${
                            selectedRewards.includes(reward.id) && reward.type === 'immediate'
                              ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10' 
                              : reward.type === 'immediate'
                              ? 'bg-slate-800/70 border-slate-700 hover:bg-slate-800/90 hover:border-slate-600'
                              : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                          }`}
                          onClick={() => reward.type === 'immediate' && handleRewardToggle(reward.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                  reward.type === 'immediate' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                                  reward.type === 'vesting' ? 'bg-yellow-500/20' : 'bg-slate-600/50'
                                }`}>
                                  {reward.icon || <Coins className="h-5 w-5 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-white text-sm">{reward.symbol}</h4>
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs font-medium ${
                                        reward.type === 'immediate' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                        reward.type === 'vesting' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                        'bg-red-500/20 text-red-400 border-red-500/30'
                                      }`}
                                    >
                                      {reward.type === 'immediate' ? '✓ Ready' :
                                       reward.type === 'vesting' ? '⏰ Vesting' : '🔒 Locked'}
                                    </Badge>
                                    {reward.apr && (
                                      <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                                        {reward.apr} APR
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400">{reward.source}</p>
                                  
                                  {showBreakdown && (
                                    <AnimatePresence>
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-2 pt-2 border-t border-slate-700"
                                      >
                                        {reward.type === 'vesting' && reward.nextVest && (
                                          <div className="flex items-center text-xs text-yellow-400 mb-1">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Next: {reward.nextVest}
                                          </div>
                                        )}
                                        {reward.type === 'locked' && reward.lockDuration && (
                                          <div className="flex items-center text-xs text-red-400 mb-1">
                                            <Lock className="h-3 w-3 mr-1" />
                                            Locked for {reward.lockDuration}
                                          </div>
                                        )}
                                        {reward.vestingEnd && (
                                          <div className="flex items-center text-xs text-slate-500">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Fully vested: {reward.vestingEnd}
                                          </div>
                                        )}
                                      </motion.div>
                                    </AnimatePresence>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-medium text-sm">{reward.amount}</div>
                                <div className="text-slate-400 text-xs">${parseFloat(reward.usdValue).toLocaleString()}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </motion.div>

            {/* Condensed Action Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Separator className="mb-4" />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {selectedRewards.length > 0 ? (
                    <>Selected {selectedRewards.length} reward{selectedRewards.length > 1 ? 's' : ''} worth ${totalSelectedUsd.toLocaleString()}</>
                  ) : (
                    'Select rewards to claim'
                  )}
                </div>
                
                <Button 
                  onClick={handleClaim}
                  disabled={selectedRewards.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Claim Selected
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Your Claim History</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {claimHistory.map((claim, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                claim.status === 'success' ? 'bg-green-500/20 text-green-400' :
                                claim.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {claim.status}
                            </Badge>
                            <span className="text-xs text-slate-400">{claim.date}</span>
                          </div>
                          <span className="text-white font-medium text-sm">{claim.usdValue}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {claim.tokens.map((token, tokenIndex) => (
                            <div key={tokenIndex} className="text-xs text-slate-300">
                              {token.amount} {token.symbol}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center space-x-2">
                            <span>Gas: {claim.gasUsed} ETH</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(claim.txHash)}
                              className="p-1 h-auto hover:bg-slate-700"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto text-slate-500 hover:text-white"
                            onClick={() => window.open(`https://etherscan.io/tx/${claim.txHash}`, '_blank')}
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}