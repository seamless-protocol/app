import type { Meta, StoryObj } from '@storybook/react'
import { FilterDropdown } from '../../components/ui/filter-dropdown'

const meta: Meta<typeof FilterDropdown> = {
  title: 'UI/FilterDropdown',
  component: FilterDropdown,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
      ],
    },
  },
  argTypes: {
    onValueChange: { action: 'value-changed' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Asset',
    value: 'all',
    options: [
      { value: 'all', label: 'All Assets', count: 16 },
      { value: 'SEAM', label: 'SEAM', count: 3 },
      { value: 'cbETH', label: 'cbETH', count: 5 },
      { value: 'rETH', label: 'rETH', count: 4 },
      { value: 'weETH', label: 'weETH', count: 4 },
    ],
  },
}

export const LeverageFilter: Story = {
  args: {
    label: 'Leverage',
    value: 'all',
    options: [
      { value: 'all', label: 'All Leverage', count: 16 },
      { value: '1-5', label: '1x - 5x', count: 3 },
      { value: '6-10', label: '6x - 10x', count: 6 },
      { value: '11-15', label: '11x - 15x', count: 4 },
      { value: '16-20', label: '16x - 20x', count: 3 },
    ],
  },
}

export const WithoutCounts: Story = {
  args: {
    label: 'Category',
    value: 'crypto',
    options: [
      { value: 'all', label: 'All Categories' },
      { value: 'crypto', label: 'Cryptocurrency' },
      { value: 'defi', label: 'DeFi' },
      { value: 'nft', label: 'NFTs' },
    ],
  },
}

export const LongLabels: Story = {
  args: {
    label: 'Protocol',
    value: 'seamless',
    options: [
      { value: 'all', label: 'All Protocols', count: 25 },
      { value: 'seamless', label: 'Seamless Protocol', count: 12 },
      { value: 'compound', label: 'Compound Finance', count: 8 },
      { value: 'aave', label: 'Aave Protocol V3', count: 5 },
    ],
  },
}
