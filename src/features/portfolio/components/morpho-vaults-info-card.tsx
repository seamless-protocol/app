import { ExternalLink } from 'lucide-react'
import { MorphoLogo } from '@/components/icons/logos/morpho-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MorphoVaultsInfoCardProps {
  className?: string
}

export function MorphoVaultsInfoCard({ className }: MorphoVaultsInfoCardProps) {
  return (
    <Card
      className={`text-[var(--text-primary)] flex flex-col gap-6 rounded-xl border bg-[color-mix(in_srgb,var(--brand-primary) 10%,transparent)] border-[color-mix(in_srgb,var(--brand-primary) 25%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand-primary) 15%,transparent)] transition-all duration-300 ${className ?? ''}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[color-mix(in_srgb,var(--brand-primary) 20%,transparent)] flex items-center justify-center flex-shrink-0">
            <MorphoLogo className="h-6 w-6" />
            <span className="sr-only">Morpho</span>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Where can I view/manage my Seamless Vaults?
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Your Seamless Vault (powered by Morpho) positions are now managed directly in the
                Morpho App. This includes depositing, withdrawing, and claiming any rewards earned
                from the Seamless Vaults on Morpho.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="bg-[color-mix(in_srgb,var(--brand-primary) 60%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand-primary) 50%,transparent)] text-[var(--text-primary)] flex items-center gap-2"
              >
                <a href="https://app.morpho.org/base/dashboard" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open Morpho App
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
