import { ExternalLink } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MorphoVaultsInfoCardProps {
  className?: string
}

export function MorphoVaultsInfoCard({ className }: MorphoVaultsInfoCardProps) {
  const gradientId = useId()

  return (
    <Card
      className={`bg-slate-900/80 border border-blue-600/40 shadow-[0_0_45px_rgba(37,99,235,0.12)] transition-colors duration-300 ${className ?? ''}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <MorphoGlyph className="h-6 w-6" gradientId={gradientId} />
            <span className="sr-only">Morpho</span>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Where can I view/manage my Seamless Vaults?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Your Seamless Vault (powered by Morpho) positions are now managed directly in the
                Morpho App. This includes depositing, withdrawing, and claiming any rewards earned
                from the Seamless Vaults on Morpho.
              </p>
            </div>

            <div>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
              >
                <a
                  href="https://app.morpho.org/ethereum/dashboard"
                  target="_blank"
                  rel="noreferrer"
                >
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

function MorphoGlyph({ className, gradientId }: { className?: string; gradientId: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${gradientId})`} />
      <path
        d="M15 32V16.5c0-1.1.9-2 2-2h1.4c.8 0 1.5.4 1.9 1.1l4.6 8.1 4.6-8.1c.4-.7 1.1-1.1 1.9-1.1H32c1.1 0 2 .9 2 2V32h-3.8V21.7l-4.6 8.2c-.4.7-1.1 1.1-1.9 1.1h-.4c-.8 0-1.5-.4-1.9-1.1l-4.6-8.1V32H15Z"
        fill="#0f172a"
      />
    </svg>
  )
}
