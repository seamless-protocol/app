'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { AlertCircle, Shield, TrendingUp, Wallet, Zap } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

export function ConnectionStatusCard() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        // If connected, show account info instead of the connection card
        if (connected) {
          return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Wallet Connected!</h1>
                <p className="text-slate-400 mb-6">
                  Connected to {chain.name} with account {account.displayName}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={openChainModal}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                    type="button"
                  >
                    Switch Network
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors"
                    type="button"
                  >
                    Account Details
                  </button>
                </div>
              </div>
            </div>
          )
        }

        // If not connected, show the connection card
        return (
          <div className="flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
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
                    <h2 className="text-xl font-semibold text-white mb-3">Connect Your Wallet</h2>
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
                      onClick={openConnectModal}
                      variant="gradient"
                      size="lg"
                      className="px-8 py-3 text-base"
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
                        Coinbase Wallet, and more. Your wallet stays secure and we never store your
                        private keys.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
