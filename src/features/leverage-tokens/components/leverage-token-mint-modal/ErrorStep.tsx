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
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Transaction Failed</h3>
        <p className="text-slate-400 text-center max-w-sm">
          {error || 'Something went wrong with your mint. Please try again.'}
        </p>
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
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
