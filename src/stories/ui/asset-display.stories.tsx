import type { Meta, StoryObj } from '@storybook/react-vite'
import { AssetDisplay } from '../../components/ui/asset-display'

const meta = {
  title: 'UI/AssetDisplay',
  component: AssetDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AssetDisplay>

export default meta
type Story = StoryObj<typeof meta>

const mockAssets = {
  weth: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
  },
  weeth: {
    symbol: 'weETH',
    name: 'Wrapped eETH',
  },
  reth: {
    symbol: 'rETH',
    name: 'Rocket Pool ETH',
  },
  usdc: {
    symbol: 'USDC',
    name: 'USD Coin',
  },
  usdt: {
    symbol: 'USDT',
    name: 'Tether USD',
  },
  dai: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
  },
  wbtc: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
  },
}

// Single Asset Stories
export const SingleAsset: Story = {
  args: {
    asset: mockAssets.weth,
  },
}

export const SingleAssetWithLink: Story = {
  args: {
    asset: mockAssets.weth,
    showLink: true,
  },
}

// Multiple Assets Stories (TokenName replacement)
export const MultipleAssets: Story = {
  args: {
    name: 'rETH / USDC Leverage Token',
    assets: [mockAssets.reth, mockAssets.usdc],
  },
}

// Size Variants
export const AllSizes: Story = {
  args: {
    name: 'rETH / USDC Leverage Token',
    assets: [mockAssets.reth, mockAssets.usdc],
  },
  render: (args) => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">Small:</span>
        <AssetDisplay {...args} size="sm" />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">Medium:</span>
        <AssetDisplay {...args} size="md" />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-16">Large:</span>
        <AssetDisplay {...args} size="lg" />
      </div>
    </div>
  ),
}

// Flexibility Showcase
export const FlexibilityShowcase: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-32">Single Asset:</span>
        <AssetDisplay asset={mockAssets.weth} />
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-32">Multiple Assets:</span>
        <AssetDisplay name="rETH/USDC Leverage Token" assets={[mockAssets.reth, mockAssets.usdc]} />
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-400 w-32">Clickable:</span>
        <AssetDisplay
          asset={mockAssets.weth}
          showLink={true}
          onClick={() => console.log('Clicked!')}
        />
      </div>
    </div>
  ),
}
