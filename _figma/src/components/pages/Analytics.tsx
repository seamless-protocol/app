"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Users,
  DollarSign,
  Target,
  Activity,
  Clock,
  Zap,
  PieChart,
  Calendar
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts"

export function Analytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')

  // Mock analytics data
  const protocolMetrics = {
    totalValueLocked: 142750000,
    totalUsers: 8934,
    totalTransactions: 45672,
    averageAPY: 11.8,
    totalVolume24h: 2340000,
    protocolFees24h: 12450
  }

  // Generate time series data
  const timeSeriesData = useMemo(() => {
    const days = selectedTimeframe === '7D' ? 7 : selectedTimeframe === '30D' ? 30 : 90
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      
      const baseTVL = 140000000
      const variation = Math.sin(i * 0.2) * 0.1 + Math.random() * 0.05 - 0.025
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tvl: Math.round(baseTVL * (1 + variation)),
        volume: Math.round(2000000 * (1 + Math.random() * 0.5)),
        users: Math.round(150 + Math.random() * 100),
        fees: Math.round(10000 + Math.random() * 5000)
      }
    })
  }, [selectedTimeframe])

  // Strategy distribution data
  const strategyDistribution = [
    { name: 'USDC Vault', value: 45, color: '#A16CFE' },
    { name: 'WETH Vault', value: 25, color: '#22D3EE' },
    { name: 'cbBTC Vault', value: 20, color: '#F9A8D4' },
    { name: 'Leverage Tokens', value: 10, color: '#10B981' }
  ]

  // User activity data
  const userActivityData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      activeUsers: Math.round(100 + Math.sin(i * Math.PI / 12) * 50 + Math.random() * 30),
      transactions: Math.round(20 + Math.sin(i * Math.PI / 12) * 10 + Math.random() * 15)
    }))
  }, [])

  const timeframes = ['7D', '30D', '90D']



  return (
    <motion.div 
      className="space-y-6"
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
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time protocol metrics and performance insights</p>
        </div>
        
        <div className="flex space-x-1">
          {timeframes.map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe)}
              className="text-xs px-3 py-1"
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Value Locked</p>
                <p className="text-2xl font-bold text-white">
                  ${(protocolMetrics.totalValueLocked / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% this month
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {protocolMetrics.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.3% this week
                </p>
              </div>
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">24h Volume</p>
                <p className="text-2xl font-bold text-white">
                  ${(protocolMetrics.totalVolume24h / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-yellow-400 mt-1 flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  {protocolMetrics.totalTransactions.toLocaleString()} txns
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Average APY</p>
                <p className="text-2xl font-bold text-white">
                  {protocolMetrics.averageAPY.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Across all strategies</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Protocol Fees (24h)</p>
                <p className="text-2xl font-bold text-white">
                  ${protocolMetrics.protocolFees24h.toLocaleString()}
                </p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15.2% vs yesterday
                </p>
              </div>
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Transactions</p>
                <p className="text-2xl font-bold text-white">
                  {protocolMetrics.totalTransactions.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">All time</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Overview Charts */}
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Overview Section */}
        <div className="space-y-6">
          <motion.h2 
            className="text-xl font-semibold text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            Overview Charts
          </motion.h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">TVL Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData}>
                      <defs>
                        <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A16CFE" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#A16CFE" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
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
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#F8FAFC'
                        }}
                        formatter={(value) => [`${(Number(value) / 1000000).toFixed(1)}M`, 'TVL']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tvl" 
                        stroke="#A16CFE" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#tvlGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Strategy Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={strategyDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {strategyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#F8FAFC'
                        }}
                        formatter={(value) => [`${value}%`, 'Share']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {strategyDistribution.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-slate-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* TVL & Volume Section */}
        <div className="space-y-6">
          <motion.h2 
            className="text-xl font-semibold text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            TVL & Volume Analysis
          </motion.h2>
          
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">TVL vs Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="tvl"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <YAxis 
                      yAxisId="volume"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
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
                      yAxisId="tvl"
                      type="monotone" 
                      dataKey="tvl" 
                      stroke="#A16CFE" 
                      strokeWidth={2}
                      dot={false}
                      name="TVL"
                    />
                    <Line 
                      yAxisId="volume"
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#22D3EE" 
                      strokeWidth={2}
                      dot={false}
                      name="Volume"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Activity Section */}
        <div className="space-y-6">
          <motion.h2 
            className="text-xl font-semibold text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            User Activity
          </motion.h2>
          
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Hourly User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userActivityData}>
                    <XAxis 
                      dataKey="hour" 
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
                    <Bar 
                      dataKey="activeUsers" 
                      fill="#A16CFE" 
                      radius={[4, 4, 0, 0]}
                      name="Active Users"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategies Section */}
        <div className="space-y-6">
          <motion.h2 
            className="text-xl font-semibold text-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            Strategy Performance & Protocol Health
          </motion.h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Strategy Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Seamless USDC Vault', apy: '12.34%', tvl: '$45.2M', change: '+2.1%' },
                    { name: 'Seamless WETH Vault', apy: '8.92%', tvl: '$28.7M', change: '+1.8%' },
                    { name: 'Seamless cbBTC Vault', apy: '10.56%', tvl: '$22.1M', change: '+3.2%' },
                    { name: 'weETH/WETH 17x Token', apy: '18.67%', tvl: '$8.9M', change: '+5.4%' }
                  ].map((strategy, index) => (
                    <motion.div
                      key={strategy.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{strategy.name}</h4>
                          <p className="text-sm text-slate-400">TVL: {strategy.tvl}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-purple-400">{strategy.apy}</p>
                          <p className="text-sm text-green-400">{strategy.change}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Protocol Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">Utilization Rate</span>
                      <span className="text-sm text-white">78.5%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '78.5%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">Liquidity Health</span>
                      <span className="text-sm text-white">92.3%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '92.3%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">Risk Score</span>
                      <span className="text-sm text-white">Low (15/100)</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}