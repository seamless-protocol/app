import { useAccount, useConnect, useConnectors, useDisconnect } from 'wagmi'

export function ConnectButtonTest() {
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { isConnected, address } = useAccount()
  const connector = useConnectors().find((c) => c.id === 'mock')

  if (!connector) return null

  // If connected, show wallet info and disconnect button
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
        <span className="text-sm" data-testid="connected-address">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          type="button"
          data-testid="disconnect-mock"
          onClick={() => disconnect()}
          className="text-xs text-red-600 hover:text-red-800"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // If not connected, show connect button
  return (
    <button
      type="button"
      data-testid="connect-mock"
      onClick={() => connect({ connector })}
      className="px-3 py-2 border rounded-md"
    >
      Connect (Mock)
    </button>
  )
}
