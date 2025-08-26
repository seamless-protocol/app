import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
  },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-2xl min-w-[40rem]">
      <AccordionItem value="strategy-overview">
        <AccordionTrigger>Strategy Overview</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This yield farming strategy leverages liquidity pools on Base to generate returns through trading fees and token rewards.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">APY:</span> 12.5%
              </div>
              <div>
                <span className="font-medium">TVL:</span> $2.4M
              </div>
              <div>
                <span className="font-medium">Risk Level:</span> Medium
              </div>
              <div>
                <span className="font-medium">Min Deposit:</span> $100
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  args: {
    type: 'multiple',
  },
  render: (args) => (
    <Accordion {...args} className="w-full max-w-2xl min-w-[40rem]">
      <AccordionItem value="recent-transactions">
        <AccordionTrigger>Recent Transactions</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <div>
                <div className="font-medium">Deposit USDC</div>
                <div className="text-sm text-muted-foreground">2 hours ago</div>
              </div>
              <div className="text-right">
                <div className="font-medium">+$1,000</div>
                <div className="text-sm text-green-600">Confirmed</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <div>
                <div className="font-medium">Withdraw ETH</div>
                <div className="text-sm text-muted-foreground">1 day ago</div>
              </div>
              <div className="text-right">
                <div className="font-medium">-0.5 ETH</div>
                <div className="text-sm text-green-600">Confirmed</div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="cancelled-transactions">
        <AccordionTrigger>Cancelled Transactions</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <div>
                <div className="font-medium">Deposit USDC</div>
                <div className="text-sm text-muted-foreground">2 hours ago</div>
              </div>
              <div className="text-right">
                <div className="font-medium">+$1,000</div>
                <div className="text-sm text-green-600">Confirmed</div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};