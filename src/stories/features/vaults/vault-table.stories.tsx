import type { Meta, StoryObj } from '@storybook/react-vite'
import { type VaultStrategy, VaultTable } from '../../../features/components/vaults/VaultTable'
import { CHAIN_IDS } from '../../../lib/utils/chain-logos'

const meta: Meta<typeof VaultTable> = {
  title: 'Features/Vaults/VaultTable',
  component: VaultTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data for vault strategies
const mockVaultData: Array<VaultStrategy> = [
  {
    id: '1',
    name: 'Seamless USDC Vault',
    description: 'Earn stable yields on USDC through optimized lending strategies',
    apy: 12.34,
    tvl: 45200000,
    riskLevel: 'Low',
    participants: 2847,
    performance7d: 0.9,
    asset: { symbol: 'USDC', name: 'USD Coin' },
    chainId: CHAIN_IDS.BASE,
  },
  {
    id: '2',
    name: 'Seamless cbBTC Vault',
    description: 'Earn yield on Bitcoin through wrapped BTC strategies',
    apy: 10.56,
    tvl: 22100000,
    riskLevel: 'Medium',
    participants: 892,
    asset: { symbol: 'cbBTC', name: 'Coinbase Bitcoin' },
    chainId: CHAIN_IDS.BASE,
  },
  {
    id: '3',
    name: 'Seamless WETH Vault',
    description: 'Generate yield on ETH through advanced DeFi strategies',
    apy: 8.92,
    tvl: 28700000,
    riskLevel: 'Medium',
    participants: 1743,
    asset: { symbol: 'WETH', name: 'Wrapped Ethereum' },
    chainId: CHAIN_IDS.ETHEREUM,
  },
]

export const Default: Story = {
  args: {
    strategies: mockVaultData,
  },
}

export const NoData: Story = {
  args: {
    strategies: [],
  },
}
