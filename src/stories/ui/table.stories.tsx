import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

const meta = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Active</TableCell>
            <TableCell className="text-right">$250.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>Inactive</TableCell>
            <TableCell className="text-right">$150.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Johnson</TableCell>
            <TableCell>bob@example.com</TableCell>
            <TableCell>Active</TableCell>
            <TableCell className="text-right">$350.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}

export const SimpleTable: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Laptop Pro</TableCell>
            <TableCell>Electronics</TableCell>
            <TableCell className="text-right">$1,299.00</TableCell>
            <TableCell className="text-right">12</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Wireless Mouse</TableCell>
            <TableCell>Accessories</TableCell>
            <TableCell className="text-right">$49.99</TableCell>
            <TableCell className="text-right">45</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Mechanical Keyboard</TableCell>
            <TableCell>Accessories</TableCell>
            <TableCell className="text-right">$199.00</TableCell>
            <TableCell className="text-right">8</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}
