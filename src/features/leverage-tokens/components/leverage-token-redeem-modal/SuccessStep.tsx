import { CheckCircle, ExternalLink, TrendingDown } from 'lucide-react'
import { useChainId } from 'wagmi'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { getTxExplorerInfo } from '../../../../lib/utils/block-explorer'

interface SuccessStepProps {
  amount: string
  expectedAmount: string
  selectedAsset: string
  transactionHash: string
  onClose: () => void
}

export function SuccessStep({
  amount,
  expectedAmount,
  selectedAsset,
  transactionHash,
  onClose,
}: SuccessStepProps) {
  const chainId = useChainId()
  const { url: txUrl, name: explorerName } = getTxExplorerInfo(chainId, transactionHash)
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Redemption Completed!</h3>
        <p className="text-slate-400 text-center max-w-sm">
          Your {amount} leverage tokens have been successfully redeemed for {expectedAmount}{' '}
          {selectedAsset}.
        </p>
      </div>

      <Card variant="gradient" className="p-4">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Redeemed</span>
            <span className="text-white">{amount} tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Received</span>
            <span className="text-white">
              {expectedAmount} {selectedAsset}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Transaction</span>
            <button
              type="button"
              onClick={() => window.open(txUrl, '_blank')}
              className="text-purple-400 hover:underline flex items-center"
            >
              View on {explorerName}
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </Card>

      <Card variant="gradient" className="p-4">
        <div className="flex items-start text-sm">
          <TrendingDown className="h-4 w-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-slate-300">
            <p className="font-medium text-white">Redemption complete</p>
            <p className="text-xs mt-1">
              Your {selectedAsset} has been transferred to your wallet. Track your remaining
              positions in your Portfolio.
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={onClose} variant="gradient" className="w-full h-12 font-medium">
        Done
      </Button>
    </div>
  )
}
