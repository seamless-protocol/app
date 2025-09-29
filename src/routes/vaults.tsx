import { createFileRoute } from '@tanstack/react-router'
import { Award, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/vaults')({
  component: () => <VaultsPage />,
})

function VaultsPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-8 py-2 xs:py-3 sm:py-4 lg:py-8">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Seamless Vaults (Powered by Morpho)
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Access institutional-grade yield strategies through Seamless Protocol's partnership
              with Morpho. Earn competitive returns with battle-tested security.
            </p>
          </div>
        </div>

        {/* Backlog: TVL/APY cards intentionally omitted for launch */}

        {/* CTA Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 via-slate-900/80 to-cyan-500/10 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300">
          <CardContent className="p-8 text-center space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Ready to Start Earning?</h2>

              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-3 text-sm">
                  <div className="flex items-center space-x-2 bg-slate-800/30 rounded-full px-4 py-2 hover:bg-slate-800/50 transition-colors duration-200">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-slate-200 font-medium">USDC Vault</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-800/30 rounded-full px-4 py-2 hover:bg-slate-800/50 transition-colors duration-200">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-slate-200 font-medium">WETH Vault</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-800/30 rounded-full px-4 py-2 hover:bg-slate-800/50 transition-colors duration-200">
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                    <span className="text-slate-200 font-medium">cbBTC Vault</span>
                  </div>
                </div>

                <div className="flex items-center justify-center mt-4">
                  <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                    <span className="text-sm text-cyan-300 font-medium">
                      Available on Base Network
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-700/40 rounded-xl p-6 max-w-2xl mx-auto border border-slate-700/50 shadow-lg backdrop-blur-sm">
                <p className="text-slate-200 leading-relaxed">
                  Access optimal risk-adjusted yield from lending to high quality collateral
                  markets.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <a
                  href="https://app.morpho.org/base/earn?curatorAddressesFilter=0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink className="mr-2" /> Deposit into Vaults
                </a>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-blue-400/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400 hover:text-blue-200"
                asChild
              >
                <a
                  href="https://app.morpho.org/ethereum/dashboard"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Award className="mr-2" /> Manage Existing Positions
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
