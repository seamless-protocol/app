import type { Meta, StoryObj } from '@storybook/react-vite'
import { CreateProposalCard } from '../../../features/governance/components/CreateProposalCard'

// Wrapper to simulate the governance page context
function GovernanceWrapper() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <CreateProposalCard />
      </div>
    </div>
  )
}

// Wrapper for centered layout
function CenteredWrapper() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <CreateProposalCard />
      </div>
    </div>
  )
}

const meta = {
  title: 'Features/Governance/CreateProposalCard',
  component: CreateProposalCard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CreateProposalCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const InContext: Story = {
  render: () => <GovernanceWrapper />,
  parameters: {
    layout: 'fullscreen',
  },
}

export const Centered: Story = {
  render: () => <CenteredWrapper />,
  parameters: {
    layout: 'fullscreen',
  },
}
