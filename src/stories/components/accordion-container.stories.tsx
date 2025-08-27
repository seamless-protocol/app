import type { Meta, StoryObj } from '@storybook/react-vite'
import { AccordionContainer } from '../../components/AccordionContainer'

const meta: Meta<typeof AccordionContainer> = {
  title: 'Components/AccordionContainer',
  component: AccordionContainer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Simple accordion data
const accordionData = {
  title: 'Frequently Asked Questions',
  description: 'Get answers to common questions about our leverage tokens.',
  items: [
    {
      id: 'how-it-works',
      title: 'How does this Leverage Token work?',
      description:
        'This 17x leverage token amplifies the performance difference between weETH and WETH, allowing traders to benefit from relative price movements with enhanced returns.',
    },
    {
      id: 'risks',
      title: 'What are the risks involved?',
      description:
        'While leverage tokens eliminate liquidation risk, they come with their own set of risks including volatility decay and compounding effects in volatile markets.',
    },
    {
      id: 'fees',
      title: 'What fees are involved?',
      description:
        'Our leverage tokens have transparent fee structures with a 2% annual management fee and rebalancing costs passed through to token holders.',
    },
  ],
}

export const Default: Story = {
  args: {
    data: accordionData,
    className: 'w-full',
  },
}

export const WithDefaultOpen: Story = {
  args: {
    data: accordionData,
    defaultOpenItems: ['how-it-works'],
    className: 'w-full',
  },
}
