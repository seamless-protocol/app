import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Ensure test env uses jsdom setup
import '../../setup'

// Mock the external KyberSwap widget to a simple placeholder component
vi.mock('@kyberswap/widgets', () => ({
  Widget: () => <div data-testid="mock-kyber-widget">Kyber Widget</div>,
}))

import { useAccount, useChainId, useConnectorClient } from 'wagmi'
import { KyberSwapWidget } from '../../../src/components/KyberSwapWidget'

describe('KyberSwapWidget modal behavior', () => {
  it('opens the modal and closes on outside click and via the close button', async () => {
    const user = userEvent.setup()

    // Set mocked wagmi hook return values for a connected wallet
    ;(useAccount as unknown as { mockReturnValue: (v: any) => void }).mockReturnValue({
      isConnected: true,
      address: '0x1234',
    })
    ;(useChainId as unknown as { mockReturnValue: (v: any) => void }).mockReturnValue(8453)
    ;(useConnectorClient as unknown as { mockReturnValue: (v: any) => void }).mockReturnValue({
      data: {},
    })

    render(<KyberSwapWidget />)

    // Open the modal by clicking the Swap/Bridge button
    const openBtn = screen.getByRole('button', { name: /open swap and bridge interface/i })
    await user.click(openBtn)

    // Modal overlay should be in the document
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement
    expect(overlay).toBeInTheDocument()

    // Close via outside click (click the overlay backdrop)
    await user.click(overlay)

    // Modal should be closed
    expect(document.querySelector('[data-slot="dialog-overlay"]')).not.toBeInTheDocument()

    // Open again
    await user.click(openBtn)

    // Close via close button (overlay is aria-hidden, so query via DOM)
    const closeBtn = document.querySelector(
      "button[aria-label='Close swap widget']",
    ) as HTMLButtonElement
    expect(closeBtn).toBeInTheDocument()
    await user.click(closeBtn)

    expect(document.querySelector('[data-slot="dialog-overlay"]')).not.toBeInTheDocument()
  })
})

