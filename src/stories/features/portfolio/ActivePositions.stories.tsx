import type { Meta, StoryObj } from '@storybook/react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { ActivePositions, type Position } from '@/features/portfolio/components/active-positions'

const meta: Meta<typeof ActivePositions> = {
  title: 'Features/Portfolio/ActivePositions',
  component: ActivePositions,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onAction: { action: 'action-clicked' },
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

const samplePositions: Array<Position> = [
  {
    id: '1',
    name: 'Seamless USDC Vault',
    type: 'vault',
    token: 'USDC',
    riskLevel: 'low',
    currentValue: {
      amount: '25,618.45',
      symbol: 'USDC',
      usdValue: '$25,618.45',
    },
    unrealizedGain: {
      amount: '618.45',
      symbol: 'USDC',
      percentage: '2.47%',
    },
    apy: '12.34%',
  },
  {
    id: '2',
    name: 'Seamless WETH Vault',
    type: 'vault',
    token: 'WETH',
    riskLevel: 'medium',
    currentValue: {
      amount: '8.72',
      symbol: 'WETH',
      usdValue: '$21,276.80',
    },
    unrealizedGain: {
      amount: '0.22',
      symbol: 'WETH',
      percentage: '2.59%',
    },
    apy: '8.92%',
  },
  {
    id: '3',
    name: 'weETH / WETH 17x Leverage Token',
    type: 'leverage-token',
    token: 'weETH',
    riskLevel: 'high',
    currentValue: {
      amount: '6.12',
      symbol: 'weETH',
      usdValue: '$14,932.80',
    },
    unrealizedGain: {
      amount: '0.62',
      symbol: 'weETH',
      percentage: '11.27%',
    },
    apy: '18.67%',
    collateralAsset: {
      symbol: 'weETH',
      name: 'Wrapped Ether.fi ETH',
    },
    debtAsset: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
    },
  },
]

const handleAction = (action: 'deposit' | 'withdraw' | 'mint' | 'redeem', position: Position) => {
  const actionText = action.charAt(0).toUpperCase() + action.slice(1)
  toast.success(`${actionText} action clicked for ${position.name}`, {
    description: `Action: ${action} | Position: ${position.name}`,
  })
}

export const Default: Story = {
  args: {
    positions: samplePositions,
    onAction: handleAction,
  },
}

export const SingleVault: Story = {
  args: {
    positions: [samplePositions[0]].filter((p): p is Position => p !== undefined),
    onAction: handleAction,
  },
}

export const SingleLeverageToken: Story = {
  args: {
    positions: [samplePositions[2]].filter((p): p is Position => p !== undefined),
    onAction: handleAction,
  },
}

export const MixedPositions: Story = {
  args: {
    positions: [samplePositions[0], samplePositions[2]].filter(
      (p): p is Position => p !== undefined,
    ), // 1 vault + 1 leverage token
    onAction: handleAction,
  },
}

export const EmptyState: Story = {
  args: {
    positions: [],
    onAction: handleAction,
  },
}
