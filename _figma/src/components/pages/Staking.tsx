"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { 
  Coins,
  TrendingUp,
  Clock,
  Users,
  Plus,
  Minus,
  Zap,
  Target,
  Calendar,
  Award,
  Lock,
  Unlock
} from "lucide-react"
import { StakeModal } from "../StakeModal"
import { ClaimModal } from "../ClaimModal"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

export function Staking() {
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [stakingAction, setStakingAction] = useState<'stake' | 'unstake'>('stake')

  // Mock user staking data
  const userStakingData = {
    totalStaked: '12,450.50',
    availableToStake: '3,750.25',
    pendingRewards: '247.83',
    stakingAPR: 24.5,
    lockPeriod: 30, // days
    nextUnlockDate: '2024-03-15',
    stakingRank: 156,
    totalStakers: 8934
  }

  // Mock staking pool data
  const stakingPools = [
    {
      id: 'seam-30d',
      name: '30-Day Lock',
      apr: '24.5%',
      lockPeriod: 30,
      totalStaked: '15.2M',
      userStaked: '8,450.50',
      minStake: '100',
      earlyWithdrawalFee: '5%'
    },
    {
      id: 'seam-90d',
      name: '90-Day Lock',
      apr: '32.8%',
      lockPeriod: 90,
      totalStaked: '8.7M',
      userStaked: '4,000.00',
      minStake: '100',
      earlyWithdrawalFee: '10%'
    },
    {
      id: 'seam-180d',
      name: '180-Day Lock',
      apr: '45.2%',
      lockPeriod: 180,
      totalStaked: '4.3M',
      userStaked: '0.00',
      minStake: '500',
      earlyWithdrawalFee: '15%'
    }
  ]

  // Mock staking rewards history
  const stakingHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rewards: Math.round(8 + Math.sin(i * 0.2) * 2 + Math.random() * 2),
      totalStaked: Math.round(12450 + Math.sin(i * 0.1) * 500)
    }
  })

  // Handle staking action
  const handleStakeAction = (action: 'stake' | 'unstake', poolId?: string) => {
    setStakingAction(action)
    setShowStakeModal(true)
  }



  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">SEAM Staking</h1>
          <p className="text-slate-400 mt-1">Stake SEAM tokens to earn rewards and participate in governance</p>
        </div>
        
        <Button
          onClick={() => setShowClaimModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
        >
          <Award className="h-4 w-4 mr-2" />
          Claim Rewards
        </Button>
      </motion.div>

      {/* Staking Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Staked</p>
                <p className="text-2xl font-bold text-white">{userStakingData.totalStaked}</p>
                <p className="text-xs text-slate-400 mt-1">SEAM tokens</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Coins className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Pending Rewards</p>
                <p className="text-2xl font-bold text-white">{userStakingData.pendingRewards}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{userStakingData.stakingAPR}% APR
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Available to Stake</p>
                <p className="text-2xl font-bold text-white">{userStakingData.availableToStake}</p>
                <p className="text-xs text-slate-400 mt-1">SEAM balance</p>
              </div>
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Staking Rank</p>
                <p className="text-2xl font-bold text-white">#{userStakingData.stakingRank}</p>
                <p className="text-xs text-slate-400 mt-1">of {userStakingData.totalStakers.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Staking Pools Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Staking Pools</h2>
          <Badge variant="secondary" className="bg-slate-800 text-slate-300">
            {stakingPools.length} Pools Available
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {stakingPools.map((pool, index) => (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Card className="bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-200 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{pool.name}</CardTitle>
                    <Badge variant="outline" className="text-green-400 border-green-400/20">
                      {pool.apr} APR
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Your Stake</span>
                      <span className="text-white">{pool.userStaked} SEAM</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Staked</span>
                      <span className="text-white">{pool.totalStaked} SEAM</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Lock Period</span>
                      <span className="text-white flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        {pool.lockPeriod} days
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Min. Stake</span>
                      <span className="text-white">{pool.minStake} SEAM</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700 mt-auto">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleStakeAction('stake', pool.id)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Stake
                      </Button>
                      
                      {parseFloat(pool.userStaked) > 0 && (
                        <Button
                          onClick={() => handleStakeAction('unstake', pool.id)}
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Unstake
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rewards History Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Rewards History</h2>
          <Badge variant="secondary" className="bg-slate-800 text-slate-300">
            Last 30 Days
          </Badge>
        </div>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Daily Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stakingHistory}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rewards" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                    name="Daily Rewards (SEAM)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Analytics</h2>
          <Badge variant="secondary" className="bg-slate-800 text-slate-300">
            Protocol Overview
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Staking Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stakingPools.map((pool, index) => {
                  const totalStakedValue = stakingPools.reduce((sum, p) => 
                    sum + parseFloat(p.totalStaked.replace('M', '')) * 1000000, 0)
                  const poolValue = parseFloat(pool.totalStaked.replace('M', '')) * 1000000
                  const percentage = (poolValue / totalStakedValue) * 100
                  
                  return (
                    <div key={pool.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{pool.name}</span>
                        <span className="text-white">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2 bg-slate-700"
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Staking Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Total Protocol Staking</p>
                  <p className="text-3xl font-bold text-white">28.2M SEAM</p>
                  <p className="text-xs text-green-400 mt-1">+12.5% this month</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-400">Avg. Lock Period</p>
                    <p className="text-xl font-bold text-white">67 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Stakers</p>
                    <p className="text-xl font-bold text-white">8,934</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-center text-sm text-slate-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    Next unlock: {userStakingData.nextUnlockDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Modals */}
      <StakeModal
        isOpen={showStakeModal}
        onClose={() => setShowStakeModal(false)}
        action={stakingAction}
      />

      <ClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />
    </motion.div>
  )
}