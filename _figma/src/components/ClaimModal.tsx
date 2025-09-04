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
import { Separator } from "./ui/separator"
import { 
  Gift,
  ExternalLink, 
  Check, 
  AlertTriangle, 
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
  ArrowUpRight,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface ClaimableReward {
  id: string
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

type ClaimFlowState = 'idle' | 'claiming' | 'success-waiting' | 'complete' | 'error'

export function ClaimModal({ isOpen, onClose, pendingRewards = 247.83 }: ClaimModalProps) {
  const context: 'governance' | 'portfolio' = 'portfolio'
  
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

  // State management
  const [selectedRewards, setSelectedRewards] = useState<string[]>([])
  const [claimFlowState, setClaimFlowState] = useState<ClaimFlowState>('idle')
  const [transactionStep, setTransactionStep] = useState(0)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [claimedRewards, setClaimedRewards] = useState<string[]>([])
  const [failedRewards, setFailedRewards] = useState<string[]>([])
  const [claimTransactionHashes, setClaimTransactionHashes] = useState<{[key: string]: string}>({})
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([])
  const [estimatedGas, setEstimatedGas] = useState("0.0035")
  const [selectedTab, setSelectedTab] = useState("claim")
  const [transactionError, setTransactionError] = useState<string | null>(null)
  
  // Multi-step claim management
  const [remainingRewardsToProcess, setRemainingRewardsToProcess] = useState<string[]>([])
  const [currentlyProcessingReward, setCurrentlyProcessingReward] = useState<ClaimableReward | null>(null)
  const [lastSuccessfulClaim, setLastSuccessfulClaim] = useState<ClaimableReward | null>(null)

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
      const immediateRewardIds = rewards.filter(r => r.type === 'immediate').map(r => r.id)
      setSelectedRewards(immediateRewardIds)
      resetClaimState()
    }
  }, [isOpen])

  const resetClaimState = () => {
    setClaimFlowState('idle')
    setTransactionStep(0)
    setTransactionError(null)
    setClaimedRewards([])
    setFailedRewards([])
    setClaimTransactionHashes({})
    setRemainingRewardsToProcess([])
    setCurrentlyProcessingReward(null)
    setLastSuccessfulClaim(null)
  }

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

  const handleStartClaiming = async () => {
    const selectedRewardData = rewards.filter(r => selectedRewards.includes(r.id))
    if (selectedRewardData.length === 0) return

    // Set up the queue of rewards to process
    setRemainingRewardsToProcess([...selectedRewards])
    setClaimFlowState('claiming')
    
    // Start with the first reward
    await processNextReward([...selectedRewards])
  }

  const processNextReward = async (rewardsQueue: string[]) => {
    if (rewardsQueue.length === 0) {
      // All rewards processed, show final completion
      setClaimFlowState('complete')
      showFinalSummary()
      return
    }

    const nextRewardId = rewardsQueue[0]
    const reward = rewards.find(r => r.id === nextRewardId)
    if (!reward) return

    try {
      setCurrentlyProcessingReward(reward)
      setClaimFlowState('claiming')
      
      // Process the transaction
      await claimSingleReward(reward)
      
      // Mark as successful
      setClaimedRewards(prev => [...prev, reward.id])
      const mockHash = '0x' + Math.random().toString(16).substr(2, 64)
      setClaimTransactionHashes(prev => ({...prev, [reward.id]: mockHash}))
      
      // Show success toast
      toast.success(`✅ ${reward.symbol} claimed successfully!`, {
        description: `${reward.amount} ${reward.symbol} worth $${parseFloat(reward.usdValue).toLocaleString()}`,
        action: {
          label: "View Transaction",
          onClick: () => window.open(`https://etherscan.io/tx/${mockHash}`, "_blank")
        }
      })
      
      // Update remaining queue
      const updatedQueue = rewardsQueue.slice(1)
      setRemainingRewardsToProcess(updatedQueue)
      setLastSuccessfulClaim(reward)
      
      // Check if there are more rewards to process
      if (updatedQueue.length > 0) {
        // Show success waiting state - user must click to continue
        setClaimFlowState('success-waiting')
      } else {
        // This was the last reward, complete the flow
        setClaimFlowState('complete')
        showFinalSummary()
      }
      
    } catch (error: any) {
      // Handle failed claim
      setFailedRewards(prev => [...prev, reward.id])
      toast.error(`❌ Failed to claim ${reward.symbol}`, {
        description: error.message || "Transaction failed"
      })
      
      // Update remaining queue and continue with next reward if any
      const updatedQueue = rewardsQueue.slice(1)
      setRemainingRewardsToProcess(updatedQueue)
      
      if (updatedQueue.length > 0) {
        // Continue with next reward after a brief pause
        setTimeout(() => {
          processNextReward(updatedQueue)
        }, 1000)
      } else {
        // No more rewards to process
        setClaimFlowState('complete')
        showFinalSummary()
      }
    }
  }

  const handleContinueWithNextClaim = () => {
    // User clicked to continue with next claim
    processNextReward(remainingRewardsToProcess)
  }

  const claimSingleReward = async (reward: ClaimableReward) => {
    setTransactionStep(1)
    await new Promise(resolve => setTimeout(resolve, 800))
    setTransactionStep(2)
    await new Promise(resolve => setTimeout(resolve, 600))
    setTransactionStep(3)
    await new Promise(resolve => setTimeout(resolve, 2000))
    if (Math.random() < 0.05) {
      throw new Error(`Failed to claim ${reward.symbol}: Transaction reverted`)
    }
    setTransactionStep(4)
    await new Promise(resolve => setTimeout(resolve, 1200))
    setTransactionStep(5)
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  const showFinalSummary = () => {
    const successCount = claimedRewards.length
    const totalCount = selectedRewards.length
    
    if (successCount === totalCount && successCount > 1) {
      toast.success("🎉 All rewards claimed successfully!", {
        description: `Successfully claimed ${successCount} rewards`
      })
    } else if (successCount > 0 && failedRewards.length > 0) {
      toast.success(`✅ ${successCount}/${totalCount} rewards claimed`, {
        description: `${failedRewards.length} failed - you can retry failed claims`
      })
    }
    
    setTimeout(() => {
      onClose()
      resetClaimState()
    }, 4000)
  }

  const retryFailedClaims = () => {
    const failedRewardIds = [...failedRewards]
    setFailedRewards([])
    setSelectedRewards(failedRewardIds)
    setTransactionError(null)
    handleStartClaiming()
  }

  const getTransactionStepText = () => {
    const rewardInfo = currentlyProcessingReward ? ` ${currentlyProcessingReward.symbol}` : ''
    switch (transactionStep) {
      case 1: return `Preparing${rewardInfo} claim transaction...`
      case 2: return `Estimating gas costs for${rewardInfo}...`
      case 3: return `Waiting for wallet signature for${rewardInfo}...`
      case 4: return `Broadcasting${rewardInfo} transaction...`
      case 5: return `Confirming${rewardInfo} on blockchain...`
      default: return "Starting transaction..."
    }
  }

  const selectedRewardData = rewards.filter(r => selectedRewards.includes(r.id))
  const totalSelectedUsd = selectedRewardData.reduce((sum, r) => sum + parseFloat(r.usdValue.replace('$', '').replace(',', '')), 0)
  const immediateRewards = rewards.filter(r => r.type === 'immediate')
  const totalRewardsUsd = immediateRewards.reduce((sum, r) => sum + parseFloat(r.usdValue.replace('$', '').replace(',', '')), 0)

  // Show success interstitial between multiple claims
  if (claimFlowState === 'success-waiting' && lastSuccessfulClaim) {
    const remainingCount = remainingRewardsToProcess.length
    const nextReward = remainingRewardsToProcess.length > 0 ? rewards.find(r => r.id === remainingRewardsToProcess[0]) : null
    
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Claim Successful</DialogTitle>
            <DialogDescription>Ready for next claim</DialogDescription>
          </DialogHeader>
          <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <motion.div className="relative w-12 h-12 mx-auto mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <CircleCheck className="h-6 w-6 text-white" />
              </div>
              <motion.div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-30" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.div>
            
            <motion.h2 className="font-semibold text-white mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              ✅ {lastSuccessfulClaim.symbol} Claimed!
            </motion.h2>
            
            <motion.div className="bg-slate-800/50 rounded-lg p-2 mb-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span>{lastSuccessfulClaim.icon}</span>
                <span className="text-white font-medium text-sm">{lastSuccessfulClaim.amount} {lastSuccessfulClaim.symbol}</span>
              </div>
              <div className="text-slate-400 text-xs">${parseFloat(lastSuccessfulClaim.usdValue).toLocaleString()}</div>
              {claimTransactionHashes[lastSuccessfulClaim.id] && (
                <Button variant="ghost" size="sm" className="mt-1 h-5 px-2 text-purple-400 hover:text-purple-300 text-xs" onClick={() => window.open(`https://etherscan.io/tx/${claimTransactionHashes[lastSuccessfulClaim.id]}`, "_blank")}>
                  <ExternalLink className="h-2 w-2 mr-1" />
                  View Tx
                </Button>
              )}
            </motion.div>

            {nextReward && (
              <motion.div className="mb-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
                <div className="text-slate-400 text-xs mb-1">{remainingCount} more reward{remainingCount !== 1 ? 's' : ''} remaining</div>
                <div className="text-slate-300 text-xs">Next: {nextReward.symbol} ({nextReward.amount})</div>
              </motion.div>
            )}

            <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
              <Button 
                onClick={handleContinueWithNextClaim}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-8 text-sm"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Continue
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              
              <Button variant="outline" onClick={onClose} className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 h-8 text-sm">
                Finish Later
              </Button>
            </motion.div>
            
            <div className="mt-2 text-xs text-slate-500">
              Claimed {claimedRewards.length + 1} of {selectedRewards.length} rewards
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  if (transactionError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Claim Failed</DialogTitle>
            <DialogDescription>An error occurred while claiming rewards</DialogDescription>
          </DialogHeader>
          <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <motion.div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <X className="h-6 w-6 text-red-400" />
            </motion.div>
            <motion.h2 className="font-semibold text-white mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              Transaction Failed
            </motion.h2>
            <motion.p className="text-slate-400 mb-3 text-xs leading-relaxed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              {transactionError}
            </motion.p>
            <motion.div className="flex space-x-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
              <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-8 text-sm">
                Close
              </Button>
              <Button onClick={() => { setTransactionError(null); handleStartClaiming() }} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-8 text-sm">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  if (claimFlowState === 'complete') {
    const completedRewards = rewards.filter(r => claimedRewards.includes(r.id))
    const failedRewardsList = rewards.filter(r => failedRewards.includes(r.id))
    const totalClaimedValue = completedRewards.reduce((sum, r) => sum + parseFloat(r.usdValue.replace('$', '').replace(',', '')), 0)
    const hasFailures = failedRewardsList.length > 0
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Claim Complete</DialogTitle>
            <DialogDescription>Your rewards have been processed</DialogDescription>
          </DialogHeader>
          <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <motion.div className="relative w-12 h-12 mx-auto mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className={`absolute inset-0 rounded-full flex items-center justify-center ${hasFailures ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-400 to-green-600'}`}>
                {hasFailures ? <AlertTriangle className="h-6 w-6 text-white" /> : <CircleCheck className="h-6 w-6 text-white" />}
              </div>
              <motion.div className={`absolute inset-0 rounded-full opacity-30 ${hasFailures ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-400 to-green-600'}`} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.div>
            <motion.h2 className="font-semibold text-white mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              {hasFailures ? '⚠️ Claims Processed' : '🎉 Rewards Claimed!'}
            </motion.h2>
            {hasFailures && (
              <motion.p className="text-yellow-400 text-xs mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
                {completedRewards.length} of {completedRewards.length + failedRewardsList.length} claims succeeded
              </motion.p>
            )}
            {completedRewards.length > 0 && (
              <motion.div className="bg-slate-800/50 rounded-lg p-2 mb-2 space-y-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
                <div className="text-xs text-green-400 font-medium mb-1 flex items-center justify-center">
                  <Check className="h-2 w-2 mr-1" />
                  Successfully Claimed
                </div>
                {completedRewards.map((reward, index) => (
                  <motion.div key={reward.id} className="flex items-center justify-between text-xs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{reward.icon}</span>
                      <span className="text-slate-300">{reward.symbol}</span>
                      {claimTransactionHashes[reward.id] && (
                        <Button variant="ghost" size="sm" className="h-4 px-1 text-purple-400 hover:text-purple-300" onClick={() => window.open(`https://etherscan.io/tx/${claimTransactionHashes[reward.id]}`, "_blank")}>
                          <ExternalLink className="h-2 w-2" />
                        </Button>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium text-xs">{reward.amount}</div>
                      <div className="text-slate-400 text-xs">${parseFloat(reward.usdValue).toLocaleString()}</div>
                    </div>
                  </motion.div>
                ))}
                {completedRewards.length > 0 && (
                  <>
                    <Separator className="my-1 bg-slate-700" />
                    <motion.div className="flex items-center justify-between font-semibold text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.8 }}>
                      <span className="text-slate-300">Total Claimed</span>
                      <span className="text-green-400">${totalClaimedValue.toLocaleString()}</span>
                    </motion.div>
                  </>
                )}
              </motion.div>
            )}
            {failedRewardsList.length > 0 && (
              <motion.div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-2 space-y-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
                <div className="text-xs text-red-400 font-medium mb-1 flex items-center justify-center">
                  <X className="h-2 w-2 mr-1" />
                  Failed Claims
                </div>
                {failedRewardsList.map((reward, index) => (
                  <motion.div key={reward.id} className="flex items-center justify-between text-xs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{reward.icon}</span>
                      <span className="text-slate-300">{reward.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-medium text-xs">{reward.amount}</div>
                      <div className="text-slate-400 text-xs">${parseFloat(reward.usdValue).toLocaleString()}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            <motion.div className="flex space-x-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.9 }}>
              <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-8 text-sm">
                Close
              </Button>
              {hasFailures && (
                <Button onClick={retryFailedClaims} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-8 text-sm">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Failed
                </Button>
              )}
              {!hasFailures && Object.keys(claimTransactionHashes).length === 1 && (
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800 h-8 text-xs" onClick={() => {
                  const txHash = Object.values(claimTransactionHashes)[0]
                  window.open(`https://etherscan.io/tx/${txHash}`, "_blank")
                }}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Tx
                </Button>
              )}
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  if (claimFlowState === 'claiming') {
    const totalRewards = selectedRewards.length
    const completedCount = claimedRewards.length
    const currentProgress = totalRewards > 1 ? 
      ((completedCount * 5 + transactionStep) / (totalRewards * 5)) * 100 : 
      (transactionStep / 5) * 100

    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Processing Claim</DialogTitle>
            <DialogDescription>Your reward claim is being processed</DialogDescription>
          </DialogHeader>
          <motion.div className="text-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <motion.div className="relative w-12 h-12 mx-auto mb-3" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </motion.div>
            <h2 className="font-semibold text-white mb-2">
              {totalRewards > 1 ? 'Processing Claims' : 'Processing Claim'}
            </h2>
            {totalRewards > 1 && (
              <div className="mb-2 px-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Claiming {completedCount + 1} of {totalRewards}</span>
                  <span>{Math.round(currentProgress)}% complete</span>
                </div>
                <Progress value={currentProgress} className="h-1 bg-slate-800" />
              </div>
            )}
            {totalRewards === 1 && (
              <div className="mb-2 px-4">
                <Progress value={(transactionStep / 5) * 100} className="h-1 bg-slate-800" />
              </div>
            )}
            {currentlyProcessingReward && (
              <div className="mb-2 bg-slate-800/50 rounded-lg p-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm">{currentlyProcessingReward.icon}</span>
                  <span className="text-white font-medium text-sm">{currentlyProcessingReward.symbol}</span>
                </div>
                <div className="text-slate-400 text-xs mt-1">{currentlyProcessingReward.amount} {currentlyProcessingReward.symbol}</div>
              </div>
            )}
            <div className="text-slate-400 text-xs px-4">
              {getTransactionStepText()}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/90 border-slate-700 max-w-2xl backdrop-blur-sm max-h-[85vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Claim Rewards</DialogTitle>
          <DialogDescription>
            Claim your available rewards from protocol activities
          </DialogDescription>
        </DialogHeader>

        {/* Compact Header */}
        <motion.div 
          className="border-b border-slate-700 pb-3 flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Gift className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Claim Rewards</h1>
          </div>
          <p className="text-slate-400 text-xs">
            Review and claim your earned rewards from staking and protocol activities
          </p>
        </motion.div>

        {/* Compact Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full flex flex-col min-h-0 flex-1">
          <TabsList className="grid w-full grid-cols-2 mb-3 flex-shrink-0 h-8">
            <TabsTrigger value="claim" className="text-xs">Claim Rewards</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Claim History</TabsTrigger>
          </TabsList>

          {/* Claim Tab */}
          <TabsContent value="claim" className="flex flex-col min-h-0 flex-1 space-y-3">
            {/* Compact Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex-shrink-0"
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white text-sm">Available Rewards</h3>
                      <p className="text-slate-400 text-xs">Total value ready to claim</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        ${totalRewardsUsd.toLocaleString()}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {immediateRewards.length} reward{immediateRewards.length !== 1 ? 's' : ''} available
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-slate-400 text-xs">
                      Selected: ${totalSelectedUsd.toLocaleString()} ({selectedRewards.length} reward{selectedRewards.length !== 1 ? 's' : ''})
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={handleClaimAll}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 h-6 px-2 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={handleClearSelection}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Compact Rewards List */}
            <ScrollArea className="flex-1 pr-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-2"
              >
                {rewards.map((reward, index) => {
                  const isSelected = selectedRewards.includes(reward.id)
                  const isSelectable = reward.type === 'immediate'
                  
                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    >
                      <Card 
                        className={`transition-all duration-200 cursor-pointer ${
                          isSelectable
                            ? isSelected 
                              ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                              : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 hover:border-slate-600'
                            : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                        }`}
                        onClick={() => isSelectable && handleRewardToggle(reward.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Token Icon and Selection */}
                              <div className="relative">
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm">
                                  {reward.icon}
                                </div>
                                {isSelectable && (
                                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isSelected 
                                      ? 'bg-purple-500 border-purple-400' 
                                      : 'bg-slate-600 border-slate-500'
                                  }`}>
                                    {isSelected && <Check className="h-2 w-2 text-white" />}
                                  </div>
                                )}
                              </div>
                              
                              {/* Reward Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-white text-sm">{reward.symbol}</h4>
                                  <Badge variant="outline" className={`text-xs ${
                                    reward.type === 'immediate' 
                                      ? 'text-green-400 border-green-400/30' 
                                      : reward.type === 'vesting'
                                      ? 'text-yellow-400 border-yellow-400/30'
                                      : 'text-slate-400 border-slate-400/30'
                                  }`}>
                                    {reward.type === 'immediate' ? 'Available' : 
                                     reward.type === 'vesting' ? 'Vesting' : 'Locked'}
                                  </Badge>
                                </div>
                                <div className="text-slate-400 text-xs">{reward.source}</div>
                                {reward.type === 'vesting' && reward.nextVest && (
                                  <div className="text-xs text-slate-400 mt-1">Next: {reward.nextVest}</div>
                                )}
                                {reward.type === 'locked' && reward.lockDuration && (
                                  <div className="text-xs text-slate-400 mt-1">Unlocks in {reward.lockDuration}</div>
                                )}
                              </div>
                            </div>
                            
                            {/* Amount and Value */}
                            <div className="text-right">
                              <div className="font-semibold text-white text-sm">
                                {reward.amount} {reward.symbol}
                              </div>
                              <div className="text-slate-400 text-xs">
                                ${parseFloat(reward.usdValue.replace('$', '').replace(',', '')).toLocaleString()}
                              </div>
                              {reward.apr && (
                                <div className="text-xs text-green-400 mt-1">
                                  {reward.apr} APR
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex flex-col min-h-0 flex-1">
            <ScrollArea className="flex-1 pr-2">
              <div>
                <h3 className="text-white text-sm font-semibold mb-3">Your Claim History</h3>
                <div className="space-y-2">
                  {claimHistory.map((claim, index) => (
                    <motion.div
                      key={claim.txHash}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-slate-900/50 border border-slate-700 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                            Success
                          </Badge>
                          <span className="text-slate-400 text-xs">{claim.date}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 text-purple-400 hover:text-purple-300 text-xs"
                          onClick={() => window.open(`https://etherscan.io/tx/${claim.txHash}`, "_blank")}
                        >
                          <ExternalLink className="h-2 w-2 mr-1" />
                          View
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        {claim.tokens.map((token, tokenIndex) => (
                          <div key={tokenIndex} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{token.symbol}</span>
                            <div className="text-right">
                              <div className="text-white">{token.amount}</div>
                              <div className="text-slate-400">{token.usdValue}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-2 bg-slate-700" />
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Total Value</span>
                        <span className="text-green-400 font-medium">{claim.usdValue}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                        <span>Gas Used: {claim.gasUsed} ETH</span>
                        <span>{claim.txHash.substring(0, 10)}...</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Compact Footer */}
        <div className="border-t border-slate-700 pt-3 flex-shrink-0">
          {/* Transaction Summary */}
          {selectedRewards.length > 0 && selectedTab === "claim" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mb-3"
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Selected rewards</span>
                      <span className="text-white font-medium">{selectedRewards.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total value</span>
                      <span className="text-white font-semibold">${totalSelectedUsd.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Estimated gas</span>
                      <span className="text-white font-medium">${estimatedGas} ETH</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="flex space-x-3"
          >
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-8 text-sm"
            >
              Cancel
            </Button>
            {selectedTab === "claim" && (
              <Button
                onClick={handleStartClaiming}
                disabled={selectedRewards.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed h-8 text-sm"
              >
                <Gift className="h-3 w-3 mr-1" />
                {selectedRewards.length === 0 
                  ? 'Select Rewards to Claim' 
                  : `Claim ${selectedRewards.length} Reward${selectedRewards.length > 1 ? 's' : ''}`
                }
              </Button>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}