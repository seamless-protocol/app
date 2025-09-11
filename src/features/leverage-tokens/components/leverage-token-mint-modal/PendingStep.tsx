import { Loader2 } from 'lucide-react'
import { Card } from '../../../../components/ui/card'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface LeverageTokenConfig {
  symbol: string
  name: string
  leverageRatio: number
}

interface PendingStepProps {
  selectedToken: Token
  amount: string
  leverageTokenConfig: LeverageTokenConfig
}

export function PendingStep({ selectedToken, amount, leverageTokenConfig }: PendingStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Processing Mint</h3>
        <p className="text-slate-400 text-center max-w-sm">
          Your leverage token mint is being processed. This may take a few moments.
        </p>
      </div>

      <Card variant="gradient" className="p-4">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Amount</span>
            <span className="text-white">
              {amount} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Leverage Token</span>
            <span className="text-white">{leverageTokenConfig.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span className="text-yellow-400">Confirming...</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
