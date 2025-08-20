import { useConnect, useConnectors } from 'wagmi'

export function ConnectButtonTest() {
  const { connect } = useConnect()
  const connector = useConnectors().find((c) => c.id === 'mock')
  if (!connector) return null
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
