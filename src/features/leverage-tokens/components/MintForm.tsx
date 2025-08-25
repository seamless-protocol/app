import { useId, useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMintViaRouter } from '../hooks/useMintViaRouter'

interface MintFormProps {
  tokenAddress: `0x${string}`
  tokenName: string
  onClose?: () => void
}

export function MintForm({ tokenAddress, tokenName, onClose }: MintFormProps) {
  console.log('MintForm rendering with:', { tokenAddress, tokenName })

  const { address: user } = useAccount()
  const amountId = useId()
  const slippageId = useId()
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('50') // 0.5% default

  console.log('User address:', user)

  const {
    mutateAsync: mintToken,
    isPending,
    isError,
    error,
    isSuccess,
    data,
  } = useMintViaRouter({
    token: tokenAddress,
    onSuccess: (hash) => {
      console.log('Mint successful! Hash:', hash)
    },
    onError: (error) => {
      console.error('Mint failed:', error)
    },
  })

  console.log('useMintViaRouter result:', { isPending, isError, error, isSuccess, data })

  const handleMint = async () => {
    if (!amount || !user) return

    try {
      // Safe decimal parsing: convert string to wei avoiding float precision issues
      const amountString = amount.trim()
      if (!amountString || Number.isNaN(Number(amountString))) {
        throw new Error('Invalid amount')
      }

      // Parse as string-based decimal to avoid float precision loss
      const [whole = '0', decimal = ''] = amountString.split('.')
      const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18) // Pad to 18 decimals, truncate if longer
      const amountBigInt = BigInt(whole + paddedDecimal)

      const slippageBps = Number.parseInt(slippage, 10)

      await mintToken({
        equityInCollateralAsset: amountBigInt,
        slippageBps,
      })
    } catch (error) {
      console.error('Mint error:', error)
    }
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Mint {tokenName}</CardTitle>
          <CardDescription>Connect your wallet to start minting</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please connect your wallet first.</p>
        </CardContent>
      </Card>
    )
  }

  // Add error boundary for debugging
  if (isError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Mint {tokenName}</CardTitle>
          <CardDescription>Error occurred</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Error: {String(error) || 'Unknown error'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Mint {tokenName}</CardTitle>
        <CardDescription>Mint leverage tokens using the Router contract</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <label htmlFor={amountId} className="text-sm font-medium">
            Amount (ETH)
          </label>
          <input
            id={amountId}
            data-testid="mint-amount-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            className="w-full p-2 border rounded-md"
            step="0.01"
            min="0"
          />
        </div>

        {/* Slippage Input */}
        <div className="space-y-2">
          <label htmlFor={slippageId} className="text-sm font-medium">
            Slippage (basis points)
          </label>
          <input
            id={slippageId}
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            placeholder="50"
            className="w-full p-2 border rounded-md"
            step="1"
            min="1"
            max="1000"
          />
          <p className="text-xs text-muted-foreground">
            {Number.parseFloat(slippage) / 100}% tolerance for price impact
          </p>
        </div>

        {/* Mint Button */}
        <Button
          data-testid="mint-submit-button"
          onClick={handleMint}
          disabled={isPending || !amount}
          className="w-full"
        >
          {isPending ? 'Minting...' : 'Mint Tokens'}
        </Button>

        {/* Status Messages */}
        {isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Error:{' '}
              {error && typeof error === 'object' && 'message' in error
                ? (error as Error).message
                : String(error) || 'Unknown error occurred'}
            </p>
          </div>
        )}

        {isSuccess && data && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              ✅ Mint successful! Hash: <span data-testid="mint-tx-hash">{data.hash}</span>
            </p>
            <p className="text-xs text-green-500 mt-1">
              Expected shares:{' '}
              <span data-testid="mint-expected-shares">
                {data.preview?.shares?.toString() || 'N/A'}
              </span>
            </p>
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
