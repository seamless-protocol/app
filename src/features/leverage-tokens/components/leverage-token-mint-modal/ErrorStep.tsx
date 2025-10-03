import { Button } from '../../../../components/ui/button'
import { getErrorDisplay } from '../../utils/errorDisplay'

interface ErrorStepProps {
  error?: string
  onRetry: () => void
  onClose: () => void
}

export function ErrorStep({ error, onRetry, onClose }: ErrorStepProps) {
  const { icon, title, message, showRetry } = getErrorDisplay(error || '', 'Transaction Failed')

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-center max-w-sm">{message}</p>
      </div>

      <div className="flex space-x-3">
        {showRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Try Again
          </Button>
        )}
        <Button onClick={onClose} variant="gradient" className={showRetry ? 'flex-1' : 'w-full'}>
          {showRetry ? 'Close' : 'OK'}
        </Button>
      </div>
    </div>
  )
}
