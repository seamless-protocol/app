"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { Separator } from "./ui/separator"
import { Progress } from "./ui/progress"
import { TokenNetworkSelector } from "./TokenNetworkSelector"
import { TransactionPreview } from "./TransactionPreview"
import { 
  ArrowUpDown, 
  Settings, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Fuel,
  AlertTriangle
} from "lucide-react"
import { 
  EthereumLogo, 
  USDCLogo, 
  USDTLogo, 
  DAILogo, 
  WBTCLogo 
} from "./ui/crypto-logos"
import { toast } from "sonner@2.0.3"

interface BridgeSwapModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Token {
  symbol: string
  name: string
  balance: string
  value: string
  logo: React.ComponentType<any>
  usdPrice?: number
}

interface Network {
  id: string
  name: string
  displayName: string
  chainId: number
  color: string
}

type TransactionStep = 'input' | 'preview' | 'processing' | 'success' | 'error'

export function BridgeSwapModal({ isOpen, onClose }: BridgeSwapModalProps) {
  const [mode, setMode] = useState<'swap' | 'bridge'>('swap')
  const [currentStep, setCurrentStep] = useState<TransactionStep>('input')
  const [fromToken, setFromToken] = useState<Token>({ 
    symbol: 'ETH', 
    name: 'Ethereum', 
    balance: '2.45', 
    value: '$4,890.00',
    logo: EthereumLogo,
    usdPrice: 2456.78
  })
  const [toToken, setToToken] = useState<Token>({ 
    symbol: 'USDC', 
    name: 'USD Coin', 
    balance: '1,250.00', 
    value: '$1,250.00',
    logo: USDCLogo,
    usdPrice: 1.00
  })
  const [fromNetwork, setFromNetwork] = useState<Network>({ id: 'ethereum', name: 'Ethereum', displayName: 'Ethereum', chainId: 1, color: 'bg-blue-500' })
  const [toNetwork, setToNetwork] = useState<Network>({ id: 'ethereum', name: 'Ethereum', displayName: 'Ethereum', chainId: 1, color: 'bg-blue-500' })
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [showSettings, setShowSettings] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [progress, setProgress] = useState(0)

  const availableTokens: Token[] = [
    { symbol: 'ETH', name: 'Ethereum', balance: '2.45', value: '$4,890.00', logo: EthereumLogo, usdPrice: 2456.78 },
    { symbol: 'USDC', name: 'USD Coin', balance: '1,250.00', value: '$1,250.00', logo: USDCLogo, usdPrice: 1.00 },
    { symbol: 'USDT', name: 'Tether USD', balance: '500.00', value: '$500.00', logo: USDTLogo, usdPrice: 1.00 },
    { symbol: 'DAI', name: 'Dai Stablecoin', balance: '750.50', value: '$750.50', logo: DAILogo, usdPrice: 1.00 },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.12', value: '$5,400.00', logo: WBTCLogo, usdPrice: 67840.25 }
  ]

  const availableNetworks: Network[] = [
    { id: 'ethereum', name: 'Ethereum', displayName: 'Ethereum', chainId: 1, color: 'bg-blue-500' },
    { id: 'base', name: 'Base', displayName: 'Base', chainId: 8453, color: 'bg-blue-600' },
    { id: 'arbitrum', name: 'Arbitrum', displayName: 'Arbitrum', chainId: 42161, color: 'bg-blue-700' },
    { id: 'polygon', name: 'Polygon', displayName: 'Polygon', chainId: 137, color: 'bg-purple-600' },
    { id: 'optimism', name: 'Optimism', displayName: 'Optimism', chainId: 10, color: 'bg-red-500' }
  ]

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('input')
      setAmount('')
      setProgress(0)
      setTransactionHash('')
      // Reset to default swap configuration
      setFromNetwork({ id: 'ethereum', name: 'Ethereum', displayName: 'Ethereum', chainId: 1, color: 'bg-blue-500' })
      setToNetwork({ id: 'ethereum', name: 'Ethereum', displayName: 'Ethereum', chainId: 1, color: 'bg-blue-500' })
      setMode('swap')
    }
  }, [isOpen])

  // Auto-detect mode based on networks
  useEffect(() => {
    setMode(fromNetwork.id === toNetwork.id ? 'swap' : 'bridge')
  }, [fromNetwork.id, toNetwork.id])

  const handleSwapTokens = () => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
  }

  const handleSwapNetworks = () => {
    const tempNetwork = fromNetwork
    setFromNetwork(toNetwork)
    setToNetwork(tempNetwork)
  }

  // Calculate USD value of input amount
  const calculateUSDValue = (amount: string, token: Token) => {
    if (!amount || !token.usdPrice || isNaN(parseFloat(amount))) return '$0.00'
    const usdValue = parseFloat(amount) * token.usdPrice
    return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Calculate output amount
  const calculateOutput = () => {
    if (!amount || isNaN(parseFloat(amount))) return '0.00'
    // Mock calculation - in reality this would call an API
    const rate = mode === 'swap' ? 1650.25 : 1645.75 // Slightly lower for bridge due to fees
    return (parseFloat(amount) * rate).toFixed(6)
  }

  // Format number for display
  const formatNumber = (value: string) => {
    if (!value) return value
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-US', { maximumFractionDigits: 6 })
  }

  // Check if amount exceeds balance
  const isInsufficientBalance = () => {
    if (!amount) return false
    return parseFloat(amount) > parseFloat(fromToken.balance)
  }

  // Handle percentage buttons
  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(fromToken.balance)
    if (isNaN(balance)) return
    
    const newAmount = (balance * percentage / 100).toString()
    setAmount(newAmount)
  }

  // Handle max button
  const handleMaxClick = () => {
    setAmount(fromToken.balance)
  }

  // Handle amount input change with formatting
  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimals
    const sanitized = value.replace(/[^0-9.]/g, '')
    // Prevent multiple decimals
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      setAmount(parts[0] + '.' + parts.slice(1).join(''))
    } else {
      setAmount(sanitized)
    }
  }

  const estimatedGas = '0.0045'
  const bridgeFee = mode === 'bridge' ? '0.001' : '0'
  const totalCost = (parseFloat(estimatedGas) + parseFloat(bridgeFee)).toFixed(4)

  const handleTransaction = async () => {
    setCurrentStep('preview')
    
    // Simulate transaction steps
    setTimeout(async () => {
      setCurrentStep('processing')
      setProgress(0)
      
      // Simulate transaction progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Simulate success or error (90% success rate)
      const success = Math.random() > 0.1
      
      if (success) {
        setTransactionHash('0x1234567890abcdef1234567890abcdef12345678')
        setCurrentStep('success')
        toast.success(`${mode === 'bridge' ? 'Bridge' : 'Swap'} completed successfully!`)
      } else {
        setCurrentStep('error')
        toast.error(`${mode === 'bridge' ? 'Bridge' : 'Swap'} failed. Please try again.`)
      }
    }, 1500)
  }

  const resetTransaction = () => {
    setCurrentStep('input')
    setProgress(0)
    setTransactionHash('')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-6">
            {/* Mode Toggle */}
            <motion.div 
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <Button
                  variant={mode === 'swap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('swap')}
                  className={mode === 'swap' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Swap
                </Button>
                <Button
                  variant={mode === 'bridge' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('bridge')}
                  className={mode === 'bridge' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Bridge
                </Button>
              </div>
            </motion.div>

            {/* From Section - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors ${isInsufficientBalance() ? 'border-red-500/50' : ''}`}>
                <CardContent className="p-4 space-y-4">
                  {/* Header with Balance */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">From</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-400">Balance:</span>
                      <span className="text-sm font-medium text-white">
                        {formatNumber(fromToken.balance)} {fromToken.symbol}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMaxClick}
                        className="text-xs h-6 px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                  
                  {/* Token Selector and Amount Input */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <TokenNetworkSelector
                        tokens={availableTokens}
                        networks={availableNetworks}
                        selectedToken={fromToken}
                        selectedNetwork={fromNetwork}
                        onTokenChange={setFromToken}
                        onNetworkChange={setFromNetwork}
                        label="From Asset"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className={`text-xl bg-transparent border-none text-right text-white placeholder-slate-500 focus:ring-0 h-12 ${
                          isInsufficientBalance() ? 'text-red-400' : ''
                        }`}
                      />
                      <div className="text-right">
                        <span className="text-sm text-slate-400">
                          {calculateUSDValue(amount, fromToken)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Insufficient Balance Warning */}
                  {isInsufficientBalance() && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center space-x-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">Insufficient {fromToken.symbol} balance</span>
                    </motion.div>
                  )}

                  {/* Percentage Buttons */}
                  <div className="flex space-x-2">
                    {[25, 50, 75, 100].map((percentage) => (
                      <Button
                        key={percentage}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePercentageClick(percentage)}
                        className="flex-1 text-xs h-8 border-slate-600 text-slate-400 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10"
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Swap/Bridge Arrow */}
            <motion.div 
              className="flex justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={mode === 'bridge' ? handleSwapNetworks : handleSwapTokens}
                className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500/50 transition-all duration-200"
              >
                <ArrowUpDown className="h-4 w-4 text-slate-400 hover:text-purple-400 transition-colors" />
              </Button>
            </motion.div>

            {/* To Section - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-4 space-y-4">
                  {/* Header with Balance */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">To</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-400">Balance:</span>
                      <span className="text-sm font-medium text-white">
                        {formatNumber(toToken.balance)} {toToken.symbol}
                      </span>
                    </div>
                  </div>
                  
                  {/* Token Selector and Output Display */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <TokenNetworkSelector
                        tokens={availableTokens}
                        networks={availableNetworks}
                        selectedToken={toToken}
                        selectedNetwork={toNetwork}
                        onTokenChange={setToToken}
                        onNetworkChange={setToNetwork}
                        label="To Asset"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <Input
                        type="text"
                        placeholder="0.0"
                        value={formatNumber(calculateOutput())}
                        readOnly
                        className="text-xl bg-transparent border-none text-right text-green-400 placeholder-slate-500 focus:ring-0 h-12"
                      />
                      <div className="text-right">
                        <span className="text-sm text-slate-400">
                          {calculateUSDValue(calculateOutput(), toToken)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exchange Rate Display */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                      <span className="text-sm text-slate-400">
                        1 {fromToken.symbol} = {(parseFloat(calculateOutput()) / parseFloat(amount)).toFixed(4)} {toToken.symbol}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary Info */}
            <motion.div 
              className="bg-slate-800/30 rounded-lg p-4 space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center">
                  <Fuel className="h-4 w-4 mr-1" />
                  Network Fee
                </span>
                <span className="text-white">{estimatedGas} ETH</span>
              </div>
              
              {mode === 'bridge' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Bridge Fee
                  </span>
                  <span className="text-white">{bridgeFee} ETH</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Est. Time
                </span>
                <span className="text-white">{mode === 'bridge' ? '2-5 min' : '~30 sec'}</span>
              </div>
            </motion.div>

            {/* Settings */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <div className="text-sm text-slate-400">
                Slippage: <span className="text-purple-400 font-medium">{slippage}%</span>
              </div>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Slippage Tolerance
                        </label>
                        <div className="flex space-x-2">
                          {['0.1', '0.5', '1.0'].map((value) => (
                            <Button
                              key={value}
                              variant={slippage === value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSlippage(value)}
                              className={slippage === value 
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500' 
                                : 'text-slate-400 border-slate-600 hover:text-white hover:border-slate-500'
                              }
                            >
                              {value}%
                            </Button>
                          ))}
                          <Input
                            type="number"
                            placeholder="Custom"
                            value={slippage}
                            onChange={(e) => setSlippage(e.target.value)}
                            className="w-20 text-sm bg-slate-900 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transaction Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleTransaction}
                disabled={!amount || parseFloat(amount) <= 0 || isInsufficientBalance()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-12 font-medium disabled:opacity-50 disabled:hover:from-purple-600 disabled:hover:to-pink-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isInsufficientBalance() 
                  ? `Insufficient ${fromToken.symbol} Balance` 
                  : `${mode === 'bridge' ? 'Bridge' : 'Swap'} ${fromToken.symbol}`
                }
              </Button>
            </motion.div>
          </div>
        )

      case 'preview':
        return (
          <TransactionPreview
            mode={mode}
            fromToken={fromToken}
            toToken={toToken}
            fromNetwork={fromNetwork}
            toNetwork={toNetwork}
            amount={amount}
            outputAmount={calculateOutput()}
            gasEstimate={estimatedGas}
            bridgeFee={bridgeFee}
            totalCost={totalCost}
            slippage={slippage}
            onConfirm={handleTransaction}
            onBack={resetTransaction}
          />
        )

      case 'processing':
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative h-16 w-16 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {mode === 'bridge' ? 'Bridging' : 'Swapping'} in Progress
              </h3>
              <p className="text-slate-400">
                {mode === 'bridge' 
                  ? `Moving ${amount} ${fromToken.symbol} from ${fromNetwork.displayName} to ${toNetwork.displayName}`
                  : `Swapping ${amount} ${fromToken.symbol} for ${toToken.symbol}`
                }
              </p>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Progress value={progress} className="w-full h-2" />
              <p className="text-sm text-slate-500">{progress}% Complete</p>
            </motion.div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="relative h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <motion.div
                  className="absolute inset-0 bg-green-500/30 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                🎉 {mode === 'bridge' ? 'Bridge' : 'Swap'} Successful!
              </h3>
              <p className="text-slate-400">
                Your transaction has been completed successfully.
              </p>
            </motion.div>

            {transactionHash && (
              <motion.div 
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Transaction Hash</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-white font-mono mt-1">
                  {transactionHash.slice(0, 20)}...
                </p>
              </motion.div>
            )}

            <motion.div 
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Button
                variant="outline"
                onClick={resetTransaction}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {mode === 'bridge' ? 'Bridge' : 'Swap'} Again
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                Done
              </Button>
            </motion.div>
          </div>
        )

      case 'error':
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {mode === 'bridge' ? 'Bridge' : 'Swap'} Failed
              </h3>
              <p className="text-slate-400">
                Your transaction could not be completed. Please try again.
              </p>
            </motion.div>

            <motion.div 
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={resetTransaction}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                Try Again
              </Button>
            </motion.div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-md backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-white">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              {mode === 'bridge' ? <ArrowRight className="h-5 w-5 text-white" /> : <ArrowUpDown className="h-5 w-5 text-white" />}
            </div>
            <span>{mode === 'bridge' ? 'Bridge Assets' : 'Swap Tokens'}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {mode === 'bridge' 
              ? 'Transfer assets securely between different blockchain networks' 
              : 'Exchange tokens instantly with the best available rates'
            }
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}