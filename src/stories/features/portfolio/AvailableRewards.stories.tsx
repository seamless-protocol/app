import type { Meta, StoryObj } from '@storybook/react'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import { AvailableRewards } from '@/features/portfolio/components/available-rewards'

const meta: Meta<typeof AvailableRewards> = {
  title: 'Features/Portfolio/AvailableRewards',
  component: AvailableRewards,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onClaim: { action: 'claim-clicked' },
  },
  decorators: [
    (Story) => (
      <div className="w-full">
        <Story />
        <Toaster />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const handleClaim = () => {
  toast.success('All rewards claimed successfully!', {
    description: 'Implement claim logic here.',
  })
}

export const Default: Story = {
  args: {
    tokenAddresses: ['USDC', 'WETH', 'WeETH', 'SEAM'],
    accruingAmount: '$1,294.34',
    seamToken: '247.83',
    protocolFees: '$156.42',
    onClaim: handleClaim,
  },
}
