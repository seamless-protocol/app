import type { Meta, StoryObj } from '@storybook/react'
import { FAQ, type FAQItem } from '../../components/FAQ'

const meta: Meta<typeof FAQ> = {
  title: 'Components/FAQ',
  component: FAQ,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title for the FAQ section',
    },
    items: {
      control: 'object',
      description: 'Array of FAQ items',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof FAQ>

const sampleFAQItems: Array<FAQItem> = [
  {
    id: 'how-leverage-token-works',
    question: 'How does this Leverage Token work?',
    answer:
      'This 17x leverage token amplifies the performance difference between weETH and WETH, allowing traders to benefit from relative price movements with enhanced returns.',
  },
  {
    id: 'risks',
    question: 'What are the risks involved?',
    answer:
      'Leverage tokens carry amplified risks including higher volatility, potential for significant losses during adverse price movements, rebalancing costs, and smart contract risks.',
  },
  {
    id: 'fees',
    question: 'Are there fees for using this token?',
    answer:
      'This leverage token charges a 0.00% mint token fee and a 0.10% redeem token fee. There are no ongoing management fees.',
  },
  {
    id: 'rebalancing',
    question: 'How often does rebalancing occur?',
    answer:
      'Rebalancing occurs automatically when the leverage ratio deviates from the target. The system uses a Dutch auction mechanism with a 1-hour duration to maintain optimal positioning.',
  },
]

export const Default: Story = {
  args: {
    title: 'Frequently Asked Questions',
    items: sampleFAQItems,
  },
}

export const CustomTitle: Story = {
  args: {
    title: 'Common Questions',
    items: sampleFAQItems.slice(0, 2),
  },
}
