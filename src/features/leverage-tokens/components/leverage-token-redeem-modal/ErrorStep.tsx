import { AlertTriangle } from 'lucide-react'
import { Button } from '../../../../components/ui/button'

interface ErrorStepProps {
  error?: string
  onRetry: () => void
  onClose: () => void
}

export function ErrorStep({ error, onRetry, onClose }: ErrorStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--state-error-text) 20%,transparent)]">
          <AlertTriangle className="h-8 w-8 text-[var(--state-error-text)]" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">Redemption Failed</h3>
        <p className="mx-auto max-w-sm text-[var(--text-secondary)]">
          {error || 'Something went wrong with your redemption. Please try again.'}
        </p>
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex-1 border-[var(--divider-line)] text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:text-[var(--text-primary)]"
        >
          Try Again
        </Button>
        <Button onClick={onClose} variant="gradient" className="flex-1">
          Close
        </Button>
      </div>
    </div>
  )
}
