import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { Skeleton } from './ui/skeleton'

export function WalletInfo() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { chains, switchChain } = useSwitchChain()
  const { data: balance } = useBalance({
    address,
  })

  if (!isConnected) {
    return <div className="p-4 border rounded">Connect your wallet to see account info</div>
  }

  return (
    <div className="p-4 border rounded space-y-4">
      <div>
        <strong>Connected Address:</strong>
        <div className="font-mono text-sm">{address}</div>
      </div>

      <div>
        <strong>Current Chain:</strong>
        <div>
          {chains.find((c) => c.id === chainId)?.name || 'Unknown'} (ID: {chainId})
        </div>
      </div>

      <div>
        <strong>Balance:</strong>
        <div>
          {balance ? `${balance.formatted} ${balance.symbol}` : <Skeleton className="h-4 w-20" />}
        </div>
      </div>

      <div>
        <strong>Switch Chain:</strong>
        <div className="flex gap-2 mt-2">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => switchChain({ chainId: chain.id })}
              className={`px-3 py-1 rounded cursor-pointer ${
                chain.id === chainId ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              type="button"
            >
              {chain.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
