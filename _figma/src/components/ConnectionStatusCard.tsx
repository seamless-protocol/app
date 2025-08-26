"use client"

import { motion } from "motion/react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Alert, AlertDescription } from "./ui/alert"
import { Wallet, Shield, Zap, TrendingUp, AlertCircle } from "lucide-react"

interface ConnectionStatusCardProps {
  onConnect: () => void
  className?: string
}

export function ConnectionStatusCard({ onConnect, className = "" }: ConnectionStatusCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Wallet className="h-8 w-8 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-white mb-3">
              Connect Your Wallet
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Connect your wallet to access Seamless Protocol's advanced DeFi strategies, 
              track your portfolio, and start earning optimized yields.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-sm text-slate-300">Secure & Private</p>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-sm text-slate-300">Instant Access</p>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-sm text-slate-300">Optimize Yields</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              onClick={onConnect}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 px-8 py-3 text-base"
              size="lg"
            >
              <Wallet className="h-5 w-5 mr-2" />
              Connect Wallet
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6"
          >
            <Alert className="bg-blue-500/10 border-blue-500/30 text-left">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                <strong>New to crypto wallets?</strong> We support MetaMask, WalletConnect, 
                Coinbase Wallet, and more. Your wallet stays secure and we never store your private keys.
              </AlertDescription>
            </Alert>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}