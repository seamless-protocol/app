import type { Meta, StoryObj } from '@storybook/react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { SEAMStaking } from '@/features/portfolio/components/seam-staking'

const meta: Meta<typeof SEAMStaking> = {
  title: 'Features/Portfolio/SEAMStaking',
  component: SEAMStaking,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onStake: { action: 'stake-clicked' },
    onManage: { action: 'manage-clicked' },
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

const handleStake = () => {
  toast.success('Staking initiated!', {
    description: 'Implement staking logic here.',
  })
}

const handleManage = () => {
  toast.info('Opening staking management...', {
    description: 'Implement management logic here.',
  })
}

export const Default: Story = {
  args: {
    stakedAmount: '1,247.83',
    earnedRewards: '82.34',
    apy: '15.67',
    onStake: handleStake,
    onManage: handleManage,
  },
}
