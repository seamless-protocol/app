import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumb } from '../../components/ui/breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'UI/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onBack: { action: 'back clicked' },
    className: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home clicked') },
      { label: 'Leverage Tokens', onClick: () => console.log('Leverage Tokens clicked') },
      { label: 'WEETH-WETH-17x', isActive: true },
    ],
    onBack: () => console.log('Back clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A breadcrumb navigation component with back button and animated breadcrumb items. The last item is marked as active and non-clickable.',
      },
    },
  },
}

export const WithoutBackButton: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home clicked') },
      { label: 'Leverage Tokens', onClick: () => console.log('Leverage Tokens clicked') },
      { label: 'WEETH-WETH-17x', isActive: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb navigation without the back button.',
      },
    },
  },
}

export const LongPath: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home clicked') },
      { label: 'Protocol', onClick: () => console.log('Protocol clicked') },
      { label: 'Leverage Tokens', onClick: () => console.log('Leverage Tokens clicked') },
      { label: 'Ethereum', onClick: () => console.log('Ethereum clicked') },
      { label: 'WEETH-WETH-17x', isActive: true },
    ],
    onBack: () => console.log('Back clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with a longer navigation path showing multiple levels.',
      },
    },
  },
}

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home', isActive: true }],
    onBack: () => console.log('Back clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with only a single item (root level).',
      },
    },
  },
}

export const TwoItems: Story = {
  args: {
    items: [
      { label: 'Leverage Tokens', onClick: () => console.log('Leverage Tokens clicked') },
      { label: 'WEETH-WETH-17x', isActive: true },
    ],
    onBack: () => console.log('Back clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with two items - parent and current page.',
      },
    },
  },
}

export const DefaultVariant: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home clicked') },
      { label: 'Leverage Tokens', onClick: () => console.log('Leverage Tokens clicked') },
      { label: 'WEETH-WETH-17x', isActive: true },
    ],
    variant: 'default',
    onBack: () => console.log('Back clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default breadcrumb variant with standard styling.',
      },
    },
  },
}

export const NoAnimation: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home clicked') },
      { label: 'Leverage Tokens', onClick: () => console.log('Leverage Tokens clicked') },
      { label: 'WEETH-WETH-17x', isActive: true },
    ],
    animated: false,
    onBack: () => console.log('Back clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb without animations for simpler use cases.',
      },
    },
  },
}

export const NoBackButton: Story = {
  args: {
    items: [
      { label: 'Home', onClick: () => console.log('Home clicked') },
      { label: 'Leverage Tokens', onClick: () => console.log('Leverage Tokens clicked') },
      { label: 'WEETH-WETH-17x', isActive: true },
    ],
    showBackButton: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb without the back button.',
      },
    },
  },
}
