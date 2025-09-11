import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import type { Meta, StoryObj } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { Button } from '../../../components/ui/button'
import { Toaster } from '../../../components/ui/sonner'
import { LeverageTokenRedeemModal } from '../../../features/leverage-tokens/components/leverage-token-redeem-modal'
import {
  LeverageTokenKey,
  leverageTokenConfigs,
} from '../../../features/leverage-tokens/leverageTokens.config'
import { config } from '../../../lib/config/wagmi.config'

const queryClient = new QueryClient()

const meta = {
  title: 'Features/Leverage Tokens/LeverageTokenRedeemModal',
  component: LeverageTokenRedeemModal,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
      ],
    },
    docs: {
      description: {
        component:
          'A multi-step modal for redeeming leverage tokens back to underlying assets with approval, confirmation, and transaction processing states.',
      },
    },
  },
  decorators: [
    (Story) => (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <div className="flex items-center justify-center min-h-screen p-4">
              <Story />
              <Toaster />
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'modal-closed',
      description: 'Callback when modal is closed',
    },
    leverageTokenAddress: {
      control: 'text',
      description: 'Address of the leverage token to redeem',
    },
    userAddress: {
      control: 'text',
      description: 'User address (optional)',
    },
  },
} satisfies Meta<typeof LeverageTokenRedeemModal>

export default meta
type Story = StoryObj<typeof meta>

// Default interactive story
export const Default: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress:
      leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]?.address ||
      '0x3f5b831fc2c82685d66cea65346128348116f064',
    userAddress: '0x52Aa899454998Be5b000Ad077a46Bbe360F4e497', // Anvil test account #0 with funded balance
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)} variant="gradient">
          Open Redeem Modal
        </Button>
        <LeverageTokenRedeemModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    )
  },
}

// Story for testing different states
export const AllStates: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress:
      leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]?.address ||
      '0x3f5b831fc2c82685d66cea65346128348116f064',
    userAddress: '0x52Aa899454998Be5b000Ad077a46Bbe360F4e497', // Anvil test account #0 with funded balance
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsOpen(true)} variant="gradient">
            Test All States
          </Button>
        </div>

        <div className="text-sm text-slate-400 max-w-md">
          <p>This story allows you to test all the different states of the redeem modal:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Input step with token amount selection</li>
            <li>Asset selection (weETH/WETH)</li>
            <li>Approval step with loading</li>
            <li>Confirmation step with summary</li>
            <li>Pending step with processing</li>
            <li>Success step with completion</li>
            <li>Error step with retry option</li>
          </ul>
        </div>

        <LeverageTokenRedeemModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    )
  },
}

// Story with different strategy IDs
export const DifferentStrategies: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress:
      leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]?.address ||
      '0x3f5b831fc2c82685d66cea65346128348116f064',
    userAddress: '0x52Aa899454998Be5b000Ad077a46Bbe360F4e497', // Anvil test account #0 with funded balance
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)
    const [strategyId, setStrategyId] = useState(LeverageTokenKey.WEETH_WETH_17X)

    const strategies = [
      { id: LeverageTokenKey.WEETH_WETH_17X, name: 'weETH/WETH 17x' },
      // Add more strategies here as they become available
      // { id: 'eth-usdc-10x', name: 'ETH/USDC 10x' },
      // { id: 'btc-eth-5x', name: 'BTC/ETH 5x' },
    ]

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {strategies.map((strategy) => (
            <Button
              key={strategy.id}
              onClick={() => {
                setStrategyId(strategy.id)
                setIsOpen(true)
              }}
              variant="outline"
            >
              Redeem {strategy.name}
            </Button>
          ))}
        </div>

        <LeverageTokenRedeemModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          leverageTokenAddress={
            leverageTokenConfigs[strategyId]?.address ||
            '0x3f5b831fc2c82685d66cea65346128348116f064'
          }
        />
      </div>
    )
  },
}

// Story without APY to show default behavior
export const WithoutAPY: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress:
      leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]?.address ||
      '0x3f5b831fc2c82685d66cea65346128348116f064',
    userAddress: '0x52Aa899454998Be5b000Ad077a46Bbe360F4e497', // Anvil test account #0 with funded balance
    // No APY prop - will default to 0%
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>Open Redeem Modal (No APY)</Button>
        <LeverageTokenRedeemModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
        <Toaster />
      </div>
    )
  },
}

// Story showing position overview
export const WithPositionOverview: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    leverageTokenAddress:
      leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]?.address ||
      '0x3f5b831fc2c82685d66cea65346128348116f064',
    userAddress: '0x52Aa899454998Be5b000Ad077a46Bbe360F4e497', // Anvil test account #0 with funded balance
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="space-y-4">
        <div className="text-sm text-slate-400 max-w-md">
          <p className="font-medium text-white mb-2">Position Overview</p>
          <p>This story shows the redeem modal with a position overview including:</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Current leverage token balance</li>
            <li>Current position value in USD</li>
            <li>Current APY being earned</li>
            <li>Leverage ratio</li>
          </ul>
        </div>

        <Button onClick={() => setIsOpen(true)} variant="gradient">
          View Position & Redeem
        </Button>

        <LeverageTokenRedeemModal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    )
  },
}
