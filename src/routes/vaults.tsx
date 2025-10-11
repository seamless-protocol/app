import { createFileRoute } from '@tanstack/react-router'
import { Award, ExternalLink } from 'lucide-react'
import { useEffect } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VaultStatCards } from '@/features/vaults/components/VaultStatCards'
import { useGA } from '@/lib/config/ga4.config'

export const Route = createFileRoute('/vaults')({
  component: () => <VaultsPage />,
})

function VaultsPage() {
  const analytics = useGA()

  // Track page view when component mounts
  useEffect(() => {
    analytics.trackPageView('Vaults', '/vaults')

    // Track feature discovery for vaults
    analytics.featureDiscovered('vaults', 'navigation')
  }, [analytics])

  return (
    <PageContainer padded={false} className="py-2 xs:py-3 sm:py-4 lg:py-8">
      <div className="space-y-8 max-w-4xl mx-auto pb-8">
        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Seamless Vaults</h1>
              <p className="text-lg sm:text-xl font-normal text-muted-foreground">
                (Powered by Morpho)
              </p>
            </div>
            <p className="text-lg text-secondary-foreground max-w-2xl mx-auto">
              Access institutional-grade yield strategies through Seamless Protocol's partnership
              with Morpho. Earn competitive returns with battle-tested security.
            </p>
          </div>
        </div>

        {/* Vault Stats */}
        <VaultStatCards />

        {/* CTA Card */}
        <Card className="text-card-foreground flex flex-col gap-6 rounded-xl bg-gradient-to-br from-purple-500/10 via-slate-900/80 to-cyan-500/10 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300">
          <CardContent className="p-8 text-center space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Ready to Start Earning?
              </h2>

              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-3 text-sm">
                  <div className="flex items-center space-x-2 rounded-full px-4 py-2 bg-secondary text-secondary-foreground border border-secondary">
                    <div className="w-3 h-3 bg-[var(--tag-success-text)] rounded-full animate-pulse" />
                    <span className="font-medium">USDC Vault</span>
                  </div>
                  <div className="flex items-center space-x-2 rounded-full px-4 py-2 bg-secondary text-secondary-foreground border border-secondary">
                    <div className="w-3 h-3 bg-[var(--tag-info-text)] rounded-full animate-pulse" />
                    <span className="font-medium">WETH Vault</span>
                  </div>
                  <div className="flex items-center space-x-2 rounded-full px-4 py-2 bg-secondary text-secondary-foreground border border-secondary">
                    <div className="w-3 h-3 bg-[var(--tag-warning-text)] rounded-full animate-pulse" />
                    <span className="font-medium">cbBTC Vault</span>
                  </div>
                </div>

                <div className="flex items-center justify-center mt-4">
                  <div className="inline-flex items-center space-x-2 rounded-full px-4 py-2 bg-[var(--tag-info-bg)] text-[var(--tag-info-text)] border border-[color-mix(in_srgb,var(--tag-info-text)_30%,transparent)]">
                    <div className="w-2 h-2 bg-[var(--tag-info-text)] rounded-full" />
                    <span className="text-sm font-medium">Available on Base Network</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-6 max-w-2xl mx-auto border border-border bg-accent">
                <p className="text-secondary-foreground leading-relaxed">
                  Access optimal risk-adjusted yield from lending to high quality collateral
                  markets.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button variant="gradient" size="lg" asChild>
                <a
                  href="https://app.morpho.org/base/earn?curatorAddressesFilter=0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink className="mr-2" /> Deposit into Vaults
                </a>
              </Button>

              <Button variant="outline" size="lg" className="hover:border-brand-purple" asChild>
                <a
                  href="https://app.morpho.org/base/dashboard"
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
    </PageContainer>
  )
}
