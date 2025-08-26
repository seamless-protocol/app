import { describe, it, expect, vi } from 'vitest'
import type { Address } from 'viem'
import { ensureAllowance } from '../../../src/domain/mint-with-router/allowance'

const token = '0x0000000000000000000000000000000000000001' as Address
const owner = '0x0000000000000000000000000000000000000002' as Address
const spender = '0x0000000000000000000000000000000000000003' as Address

function makeClients({ allowance }: { allowance: bigint }) {
  return {
    publicClient: {
      readContract: vi.fn(async () => allowance),
      simulateContract: vi.fn(),
      waitForTransactionReceipt: vi.fn(),
    },
    walletClient: {
      writeContract: vi.fn(),
    },
  } as any
}

describe('ensureAllowance', () => {
  it('does nothing when allowance is sufficient', async () => {
    const clients = makeClients({ allowance: 1000n })

    await ensureAllowance(clients as any, token, owner, spender, 500n)

    expect(clients.publicClient.readContract).toHaveBeenCalled()
    expect(clients.publicClient.simulateContract).not.toHaveBeenCalled()
    expect(clients.walletClient.writeContract).not.toHaveBeenCalled()
  })

  it('approves max when allowance is insufficient', async () => {
    const clients = makeClients({ allowance: 10n })
    const request = { address: token, abi: [], functionName: 'approve' }
    const hash = '0x' + 'a'.repeat(64)
    clients.publicClient.simulateContract.mockResolvedValue({ request })
    clients.walletClient.writeContract.mockResolvedValue(hash)
    clients.publicClient.waitForTransactionReceipt.mockResolvedValue({ status: 'success' })

    await ensureAllowance(clients as any, token, owner, spender, 500n)

    expect(clients.publicClient.simulateContract).toHaveBeenCalled()
    expect(clients.walletClient.writeContract).toHaveBeenCalledWith(request)
    expect(clients.publicClient.waitForTransactionReceipt).toHaveBeenCalledWith({ hash })
  })
})

