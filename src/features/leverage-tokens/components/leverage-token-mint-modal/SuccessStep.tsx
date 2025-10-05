import { CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { useExplorer } from '../../../../lib/hooks/useExplorer'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface SuccessStepProps {
  selectedToken: Token
  amount: string
  expectedTokens: string
  leverageTokenSymbol: string
  transactionHash: string
  onClose: () => void
}

export function SuccessStep({
  selectedToken,
  amount,
  expectedTokens,
  leverageTokenSymbol,
  transactionHash,
  onClose,
}: SuccessStepProps) {
  const explorer = useExplorer()
  const txUrl = explorer.txUrl(transactionHash)
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Mint Success!</h3>
        <p className="text-slate-400 text-center max-w-sm">
          Your {amount} {selectedToken.symbol} has been successfully minted into {expectedTokens}{' '}
          {leverageTokenSymbol}.
        </p>
      </div>

      <Card variant="gradient" className="p-4">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Minted</span>
            <span className="text-white">
              {amount} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Received</span>
            <span className="text-white">
              {expectedTokens} {leverageTokenSymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Transaction</span>
            <button
              type="button"
              onClick={() => window.open(txUrl, '_blank')}
              className="text-purple-400 hover:underline flex items-center"
            >
              View on {explorer.name}
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </Card>

      <Button onClick={onClose} variant="gradient" className="w-full h-12 font-medium">
        Done
      </Button>
    </div>
  )
}
