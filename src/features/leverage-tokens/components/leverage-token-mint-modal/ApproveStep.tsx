import { Loader2 } from 'lucide-react'
import { Card } from '../../../../components/ui/card'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface ApproveStepProps {
  selectedToken: Token
  amount: string
  isApproving: boolean
}

export function ApproveStep({ selectedToken, amount, isApproving }: ApproveStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Approve Token Spending</h3>
        <p className="text-slate-400 text-center max-w-sm">
          {isApproving
            ? 'Confirm the approval transaction in your wallet...'
            : 'Approve the contract to spend your ' +
              selectedToken.symbol +
              '. This is a one-time approval for this token.'}
        </p>
      </div>

      <Card variant="gradient" className="p-4">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Token</span>
            <span className="text-white">{selectedToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Amount to approve</span>
            <span className="text-white">
              {isApproving ? 'Max' : amount} {selectedToken.symbol}
            </span>
          </div>
          {isApproving && (
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-yellow-400">Confirming...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
