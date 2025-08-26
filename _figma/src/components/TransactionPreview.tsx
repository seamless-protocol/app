"use client"

import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"
import { Badge } from "./ui/badge"
import { ArrowRight, Info, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

interface Token {
  symbol: string
  name: string
  balance: string
  value: string
}

interface Network {
  id: string
  name: string
  displayName: string
  chainId: number
  color: string
}

interface TransactionPreviewProps {
  mode: 'swap' | 'bridge'
  fromToken: Token
  toToken: Token
  fromNetwork: Network
  toNetwork: Network
  amount: string
  outputAmount: string
  gasEstimate: string
  bridgeFee: string
  totalCost: string
  slippage: string
  onConfirm: () => void
  onBack: () => void
}

export function TransactionPreview({
  mode,
  fromToken,
  toToken,
  fromNetwork,
  toNetwork,
  amount,
  outputAmount,
  gasEstimate,
  bridgeFee,
  totalCost,
  slippage,
  onConfirm,
  onBack
}: TransactionPreviewProps) {
  const getTokenIcon = (symbol: string) => {
    const colors: { [key: string]: string } = {
      'ETH': 'bg-blue-500',
      'USDC': 'bg-blue-600',
      'USDT': 'bg-green-500',
      'DAI': 'bg-yellow-500',
      'WBTC': 'bg-orange-500'
    }
    return colors[symbol] || 'bg-gray-500'
  }

  const getNetworkIcon = (id: string) => {
    const colors: { [key: string]: string } = {
      'ethereum': 'bg-blue-500',
      'base': 'bg-blue-600',
      'arbitrum': 'bg-blue-700',
      'polygon': 'bg-purple-600',
      'optimism': 'bg-red-500'
    }
    return colors[id] || 'bg-gray-500'
  }

  const estimatedTime = mode === 'bridge' ? '5-10 minutes' : '~15 seconds'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-dark-primary mb-2">
          Review {mode === 'bridge' ? 'Bridge' : 'Swap'}
        </h3>
        <p className="text-sm text-dark-secondary">
          Please review your transaction details before confirming
        </p>
      </div>

      {/* Transaction Summary */}
      <Card className="bg-dark-elevated border-divider-line">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* From */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTokenIcon(fromToken.symbol)}`}>
                <span className="text-sm font-medium text-white">
                  {fromToken.symbol.slice(0, 2)}
                </span>
              </div>
              <div>
                <div className="text-lg font-semibold text-dark-primary">{amount}</div>
                <div className="text-sm text-dark-muted">{fromToken.symbol}</div>
                {mode === 'bridge' && (
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 ${getNetworkIcon(fromNetwork.id)} bg-opacity-20 border-opacity-30`}
                  >
                    {fromNetwork.displayName}
                  </Badge>
                )}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-5 w-5 text-dark-muted" />

            {/* To */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTokenIcon(toToken.symbol)}`}>
                <span className="text-sm font-medium text-white">
                  {toToken.symbol.slice(0, 2)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-dark-primary">{outputAmount}</div>
                <div className="text-sm text-dark-muted">{toToken.symbol}</div>
                {mode === 'bridge' && (
                  <Badge
                    variant="outline"
                    className={`text-xs mt-1 ${getNetworkIcon(toNetwork.id)} bg-opacity-20 border-opacity-30`}
                  >
                    {toNetwork.displayName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card className="bg-dark-card border-divider-line">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-dark-primary">Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-muted">Rate</span>
            <span className="text-sm text-dark-primary">
              1 {fromToken.symbol} = {(parseFloat(outputAmount) / parseFloat(amount)).toFixed(4)} {toToken.symbol}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-muted">Slippage Tolerance</span>
            <span className="text-sm text-dark-primary">{slippage}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-muted">Estimated Time</span>
            <span className="text-sm text-dark-primary">{estimatedTime}</span>
          </div>

          <Separator className="bg-divider-line" />

          <div className="flex justify-between items-center">
            <span className="text-sm text-dark-muted">Network Fee</span>
            <span className="text-sm text-dark-primary">~{gasEstimate} ETH</span>
          </div>

          {mode === 'bridge' && parseFloat(bridgeFee) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark-muted">Bridge Fee</span>
              <span className="text-sm text-dark-primary">{bridgeFee} ETH</span>
            </div>
          )}

          <div className="flex justify-between items-center font-medium">
            <span className="text-sm text-dark-primary">Total Cost</span>
            <span className="text-sm text-dark-primary">~{totalCost} ETH</span>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {mode === 'bridge' && (
        <Alert className="bg-warning-yellow/10 border-warning-yellow/30">
          <AlertTriangle className="h-4 w-4 text-warning-yellow" />
          <AlertDescription className="text-dark-secondary">
            Bridge transactions may take longer than usual. Please do not close your browser until the transaction is complete.
          </AlertDescription>
        </Alert>
      )}

      {parseFloat(slippage) > 1 && (
        <Alert className="bg-warning-yellow/10 border-warning-yellow/30">
          <Info className="h-4 w-4 text-warning-yellow" />
          <AlertDescription className="text-dark-secondary">
            High slippage tolerance may result in unfavorable rates. Consider reducing slippage if not urgent.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-divider-line text-dark-secondary hover:bg-dark-elevated"
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-brand-purple hover:bg-brand-purple/90 text-white"
        >
          Confirm {mode === 'bridge' ? 'Bridge' : 'Swap'}
        </Button>
      </div>
    </div>
  )
}