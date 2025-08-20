import { useState } from 'react'
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
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('50') // 0.5% default

  console.log('User address:', user)

  const { mutateAsync: mintToken, isPending, isError, error, isSuccess, data } = useMintViaRouter({
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
      const amountBigInt = BigInt(parseFloat(amount) * 10 ** 18) // Assuming 18 decimals
      const slippageBps = parseInt(slippage)

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
          <label className="text-sm font-medium">Amount (ETH)</label>
          <input
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
          <label className="text-sm font-medium">Slippage (basis points)</label>
          <input
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
            {parseFloat(slippage) / 100}% tolerance for price impact
          </p>
        </div>

        {/* Mint Button */}
        <Button
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
              Error: {error?.message || 'Unknown error occurred'}
            </p>
          </div>
        )}

        {isSuccess && data && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              ✅ Mint successful! Hash: {data.hash}
            </p>
            <p className="text-xs text-green-500 mt-1">
              Expected shares: {data.preview?.shares?.toString() || 'N/A'}
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