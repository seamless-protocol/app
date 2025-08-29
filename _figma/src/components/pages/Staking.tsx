"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { Switch } from "../ui/switch"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { 
  Coins,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Network
} from "lucide-react"
import { StakeModal } from "../StakeModal"
import { ClaimModal } from "../ClaimModal"
import { USDCLogo, EthereumLogo, cbBTCLogo } from "../ui/crypto-logos"

export function Staking() {
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [stakingAction, setStakingAction] = useState<'stake' | 'unstake'>('stake')
  const [isStakeMode, setIsStakeMode] = useState(true)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [openFAQs, setOpenFAQs] = useState<Record<string, boolean>>({})

  // Mock user staking data based on screenshot
  const userStakingData = {
    currentHoldings: 0.00,
    stkSeamBalance: '0.00',
    claimableRewards: 0.00,
    totalStaked: 3.70, // 3.70M SEAM
    totalAPR: 35.72,
    unstakingCooldown: 7, // days
    availableBalance: 1250.75, // Available SEAM balance for staking
    stakedBalance: 500.25 // Currently staked SEAM for unstaking
  }

  // Mock vault rewards data
  const vaultRewards = [
    {
      name: 'Seamless USDC Vault',
      symbol: 'smUSDC',
      logo: USDCLogo,
      apr: 30.27
    },
    {
      name: 'Seamless WETH Vault', 
      symbol: 'smWETH',
      logo: EthereumLogo,
      apr: 5.37
    },
    {
      name: 'Seamless cbBTC Vault',
      symbol: 'smcBTC', 
      logo: cbBTCLogo,
      apr: 0.07
    }
  ]

  // FAQ data from screenshot
  const faqData = [
    {
      id: 'benefits',
      question: 'What are the benefits of staking?',
      answer: 'Staking SEAM tokens allows you to earn protocol rewards while participating in governance. You receive a share of protocol fees and additional incentives based on your staking duration and amount.'
    },
    {
      id: 'fees',
      question: 'By staking, how much protocol fees/rewards can I expect?',
      answer: 'Protocol rewards vary based on total staked amount, protocol performance, and your stake duration. Current APR ranges from 5-35% depending on the reward source.'
    },
    {
      id: 'claiming',
      question: 'How often can I claim staking rewards?',
      answer: 'Rewards can be claimed at any time. However, note that SEAM can only be unstaked after the 7-day cooldown period expires.'
    },
    {
      id: 'unstaking',
      question: 'How do I unstake SEAM?',
      answer: 'To unstake SEAM, initiate the unstaking process which triggers a 7-day cooldown period. After the cooldown expires, you can complete the unstaking to receive your SEAM tokens.'
    },
    {
      id: 'cooldown',
      question: 'What happens after the 7-day cooldown expires?',
      answer: 'After the 7-day cooldown period, you have a window to complete your unstaking. If you don\'t unstake during this window, you\'ll need to restart the cooldown process.'
    },
    {
      id: 'earning-during-cooldown',
      question: 'Do I continue to earn staking rewards during the unstake cooldown period?',
      answer: 'Yes, you continue to earn staking rewards during the cooldown period until you complete the unstaking process.'
    },
    {
      id: 'cooldown-purpose',
      question: 'Why is there a cooldown period and unstaking windows?',
      answer: 'The cooldown period helps maintain protocol stability and prevents rapid exits that could impact the staking ecosystem. It also ensures fair reward distribution.'
    },
    {
      id: 'slashing',
      question: 'What does it mean to be "slashed"?',
      answer: 'Slashing is a penalty mechanism where a portion of staked tokens can be reduced if the protocol experiences certain adverse events. This helps align staker incentives with protocol health.'
    },
    {
      id: 'learn-more',
      question: 'Where can I learn more?',
      answer: 'Visit our documentation, Discord community, or governance forum for detailed information about staking mechanics, rewards, and protocol updates.'
    }
  ]

  const toggleFAQ = (id: string) => {
    setOpenFAQs(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleStakeToggle = (checked: boolean) => {
    setIsStakeMode(checked)
  }

  // Get available balance based on current mode
  const availableBalance = isStakeMode ? userStakingData.availableBalance : userStakingData.stakedBalance
  const currentAmount = isStakeMode ? stakeAmount : unstakeAmount
  const setCurrentAmount = isStakeMode ? setStakeAmount : setUnstakeAmount

  // Handle percentage button clicks
  const handlePercentageClick = (percentage: number) => {
    const amount = (availableBalance * percentage / 100).toFixed(2)
    setCurrentAmount(amount)
  }

  // Handle max button click
  const handleMaxClick = () => {
    setCurrentAmount(availableBalance.toFixed(2))
  }

  // Handle amount input change
  const handleAmountChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const sanitized = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      return
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return
    }
    
    // Don't allow amounts greater than available balance
    const numericValue = parseFloat(sanitized)
    if (numericValue > availableBalance) {
      return
    }
    
    setCurrentAmount(sanitized)
  }

  // Calculate USD value
  const usdValue = currentAmount ? (parseFloat(currentAmount) * 2.15).toFixed(2) : '0.00'

  // Check if amount is valid for submission
  const isValidAmount = currentAmount && parseFloat(currentAmount) > 0 && parseFloat(currentAmount) <= availableBalance

  // Calculate estimated daily rewards
  const estimatedDailyRewards = currentAmount ? 
    ((parseFloat(currentAmount) * userStakingData.totalAPR / 100 / 365) * 2.15).toFixed(2) : '0.00'



  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Base Chain Network Requirement Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">Base Chain Required</h3>
              <Badge variant="outline" className="border-blue-500/50 text-blue-300 bg-blue-500/10">
                Base
              </Badge>
            </div>
            <p className="text-sm text-blue-200/80 mt-1">
              SEAM staking is only available on Base Chain. Please ensure your wallet is connected to Base to participate in staking.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main 2-Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Panel - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Current Holdings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Current holdings</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">S</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{userStakingData.currentHoldings.toFixed(2)} stkSEAM</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">${userStakingData.currentHoldings.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Claimable Rewards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-white mb-2">Claimable rewards</p>
                    <p className="text-3xl font-bold text-white">${userStakingData.claimableRewards.toFixed(2)}</p>
                    <p className="text-sm text-slate-400 mt-1">Stake SEAM to receive rewards.</p>
                  </div>
                  <Button
                    onClick={() => setShowClaimModal(true)}
                    disabled={userStakingData.claimableRewards === 0}
                    className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Claim
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Metrics Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-slate-400">Total Staked</p>
                  <p className="text-xl font-bold text-white">{userStakingData.totalStaked}M SEAM</p>
                  <p className="text-xs text-slate-400 mt-1">${(userStakingData.totalStaked * 2.15).toFixed(1)}M</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-slate-400">Total APR</p>
                  <p className="text-xl font-bold text-white">{userStakingData.totalAPR}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-4">
                <div>
                  <p className="text-sm text-slate-400">Unstaking cooldown</p>
                  <p className="text-xl font-bold text-white">{userStakingData.unstakingCooldown} days</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Rewards Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300 py-4 px-6">Rewards</TableHead>
                      <TableHead className="text-slate-300 py-4 px-6">Name</TableHead>
                      <TableHead className="text-slate-300 py-4 px-6">Symbol</TableHead>
                      <TableHead className="text-slate-300 py-4 px-6 text-right">APR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vaultRewards.map((vault, index) => {
                      const LogoComponent = vault.logo
                      return (
                        <TableRow key={vault.symbol} className="border-slate-700 hover:bg-slate-800/30">
                          <TableCell className="py-4 px-6">
                            <div className="w-10 h-10 rounded-full border-2 border-slate-600 bg-slate-800 flex items-center justify-center p-1">
                              <LogoComponent size={24} />
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="text-white font-medium">{vault.name}</span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="text-slate-300">{vault.symbol}</span>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right">
                            <span className="text-white font-medium">{vault.apr.toFixed(2)}%</span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staking Details FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-white">Staking details</h2>
            
            <div className="space-y-2">
              {faqData.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                >
                  <Collapsible
                    open={openFAQs[faq.id]}
                    onOpenChange={() => toggleFAQ(faq.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700 rounded-lg transition-colors">
                        <span className="text-left text-white font-medium">{faq.question}</span>
                        {openFAQs[faq.id] ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 bg-slate-900/30 border border-t-0 border-slate-700 rounded-b-lg">
                        <p className="text-slate-300 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Stake/Unstake Module */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="xl:col-span-1"
        >
          <div className="sticky top-6">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-4 space-y-4">
                
                {/* Compact Header */}
                <div className="flex items-center space-x-3 p-3 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Coins className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Stake SEAM</h3>
                    <p className="text-xs text-slate-400">Earn protocol rewards</p>
                  </div>
                </div>
                
                {/* Compact Toggle Switch */}
                <div className="relative bg-slate-800/60 backdrop-blur-sm rounded-lg p-1 border border-slate-700/50">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setIsStakeMode(true)}
                      className={`relative px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                        isStakeMode 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="flex items-center justify-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Stake</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setIsStakeMode(false)}
                      className={`relative px-3 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
                        !isStakeMode 
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/25' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="flex items-center justify-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Unstake</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Interactive Amount Input Section */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-purple-400" />
                    <span>{isStakeMode ? 'Amount to stake' : 'Amount to unstake'}</span>
                  </Label>
                  
                  {/* Interactive Input Area */}
                  <div className="relative bg-slate-800/60 backdrop-blur-sm border border-slate-700/70 rounded-lg p-4 space-y-3">
                    {/* Amount Input and Display */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="0.00"
                          value={currentAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="text-2xl font-bold text-white bg-transparent border-none p-0 h-auto focus:ring-0 focus-visible:ring-0 placeholder:text-slate-600"
                          style={{ fontSize: '1.5rem' }}
                        />
                        <div className="text-xs text-slate-400 mt-1">~${usdValue}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">S</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">SEAM</div>
                          <div className="text-xs text-slate-400">
                            Balance: {availableBalance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Interactive Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePercentageClick(25)}
                        className="h-8 text-xs bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-purple-500/50 hover:text-white transition-all duration-200"
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePercentageClick(50)}
                        className="h-8 text-xs bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-purple-500/50 hover:text-white transition-all duration-200"
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePercentageClick(75)}
                        className="h-8 text-xs bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-purple-500/50 hover:text-white transition-all duration-200"
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMaxClick}
                        className="h-8 text-xs bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-purple-500/50 hover:text-white transition-all duration-200"
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Compact Info Message */}
                <div className="flex items-start space-x-2 text-xs bg-slate-800/30 border border-cyan-500/20 p-3 rounded-lg">
                  <Info className="h-3 w-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-400 leading-relaxed">
                    7 day cooldown required for unstaking. Rewards continue during cooldown.
                  </p>
                </div>

                {/* Interactive Action Button */}
                <Button
                  disabled={!isValidAmount}
                  onClick={() => isValidAmount && setShowStakeModal(true)}
                  className={`w-full h-10 border border-slate-600/50 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isValidAmount
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white cursor-pointer'
                      : 'bg-slate-700/80 hover:bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isValidAmount 
                    ? (isStakeMode ? `Stake ${currentAmount} SEAM` : `Unstake ${currentAmount} SEAM`)
                    : (isStakeMode ? 'Enter amount to stake' : 'Enter amount to unstake')
                  }
                </Button>
                
                {/* Compact Transaction Summary */}
                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-semibold text-white flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span>Summary</span>
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-lg font-bold text-green-400">{userStakingData.totalAPR}%</span>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <span className="text-xs text-slate-400">APR</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-sm font-medium text-white">{userStakingData.unstakingCooldown}d</span>
                      </div>
                      <span className="text-xs text-slate-400">Cooldown</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-center space-x-1">
                        <DollarSign className="h-3 w-3 text-slate-400" />
                        <span className="text-sm font-medium text-white">${estimatedDailyRewards}</span>
                      </div>
                      <span className="text-xs text-slate-400">Daily</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <StakeModal
        isOpen={showStakeModal}
        onClose={() => {
          setShowStakeModal(false)
          // Clear amounts after modal closes
          setStakeAmount('')
          setUnstakeAmount('')
        }}
        action={isStakeMode ? 'stake' : 'unstake'}
        amount={currentAmount}
        tokenSymbol="SEAM"
      />

      <ClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </motion.div>
  )
}