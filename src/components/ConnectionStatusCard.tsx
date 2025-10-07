import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Wallet, Zap } from 'lucide-react'
import { Alert } from './ui/alert'
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
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground mb-4">Wallet Connected!</h1>
                <p className="text-secondary-foreground mb-6">
                  Connected to {chain.name} with account {account.displayName}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={openChainModal} variant="outline" type="button">
                    Switch Network
                  </Button>
                  <Button onClick={openAccountModal} variant="outline" type="button">
                    Account Details
                  </Button>
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
              <Card className="border border-border bg-card text-foreground">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-violet"
                  >
                    <Wallet className="h-8 w-8 text-primary-foreground" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      Connect Your Wallet
                    </h2>
                    <p className="text-secondary-foreground mb-6 max-w-md mx-auto">
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
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                        <Shield className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-secondary-foreground">Secure & Private</p>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400">
                        <Zap className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-secondary-foreground">Instant Access</p>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-secondary-foreground">Optimize Yields</p>
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
                      className="px-8 text-base"
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
                    <Alert
                      type="info"
                      title="New to crypto wallets?"
                      description="We support MetaMask, WalletConnect, Coinbase Wallet, and more. Your wallet stays secure and we never store your private keys."
                      className="text-left"
                    />
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
