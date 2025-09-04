import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TablePagination,
  TableRow,
  usePagination,
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

// Sample data for pagination examples
const sampleData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Strategy ${i + 1}`,
  apy: `${(Math.random() * 20 + 5).toFixed(2)}%`,
  tvl: `$${(Math.random() * 1000000 + 100000).toLocaleString()}`,
  risk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
  status: ['Active', 'Paused', 'Closed'][Math.floor(Math.random() * 3)],
}))

export const Default: Story = {
  render: () => {
    const { currentItems, currentPage, totalPages, goToPage } = usePagination(
      sampleData.slice(0, 10),
      10,
    )

    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strategy</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>TVL</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((strategy) => (
                <TableRow key={strategy.id}>
                  <TableCell className="font-medium">{strategy.name}</TableCell>
                  <TableCell>{strategy.apy}</TableCell>
                  <TableCell>{strategy.tvl}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.risk === 'Low'
                          ? 'default'
                          : strategy.risk === 'Medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {strategy.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.status === 'Active'
                          ? 'default'
                          : strategy.status === 'Paused'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {strategy.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sampleData.slice(0, 10).length}
            pageSize={10}
            onPageChange={goToPage}
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story shows a table with 10 rows and always displays the pagination footer. Since there is only 1 page, navigation buttons are hidden but the footer shows "Showing 1 to 10 of 10 results".',
      },
    },
  },
}

export const WithPagination: Story = {
  render: () => {
    const { currentItems, currentPage, totalPages, goToPage } = usePagination(sampleData, 10)

    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strategy</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>TVL</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((strategy) => (
                <TableRow key={strategy.id}>
                  <TableCell className="font-medium">{strategy.name}</TableCell>
                  <TableCell>{strategy.apy}</TableCell>
                  <TableCell>{strategy.tvl}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.risk === 'Low'
                          ? 'default'
                          : strategy.risk === 'Medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {strategy.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.status === 'Active'
                          ? 'default'
                          : strategy.status === 'Paused'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {strategy.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sampleData.length}
            pageSize={10}
            onPageChange={goToPage}
          />
        </div>
      </div>
    )
  },
}

export const CustomPageSize: Story = {
  render: () => {
    const { currentItems, currentPage, totalPages, goToPage } = usePagination(sampleData, 5)

    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strategy</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>TVL</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((strategy) => (
                <TableRow key={strategy.id}>
                  <TableCell className="font-medium">{strategy.name}</TableCell>
                  <TableCell>{strategy.apy}</TableCell>
                  <TableCell>{strategy.tvl}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.risk === 'Low'
                          ? 'default'
                          : strategy.risk === 'Medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {strategy.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.status === 'Active'
                          ? 'default'
                          : strategy.status === 'Paused'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {strategy.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sampleData.length}
            pageSize={5}
            onPageChange={goToPage}
          />
        </div>
      </div>
    )
  },
}

export const LargeDataset: Story = {
  render: () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `Large Strategy ${i + 1}`,
      apy: `${(Math.random() * 30 + 2).toFixed(2)}%`,
      tvl: `$${(Math.random() * 5000000 + 50000).toLocaleString()}`,
      risk: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      status: ['Active', 'Paused', 'Closed'][Math.floor(Math.random() * 3)],
    }))

    const { currentItems, currentPage, totalPages, goToPage } = usePagination(largeDataset, 15)

    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strategy</TableHead>
                <TableHead>APY</TableHead>
                <TableHead>TVL</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((strategy) => (
                <TableRow key={strategy.id}>
                  <TableCell className="font-medium">{strategy.name}</TableCell>
                  <TableCell>{strategy.apy}</TableCell>
                  <TableCell>{strategy.tvl}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.risk === 'Low'
                          ? 'default'
                          : strategy.risk === 'Medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {strategy.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        strategy.status === 'Active'
                          ? 'default'
                          : strategy.status === 'Paused'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {strategy.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={largeDataset.length}
            pageSize={15}
            onPageChange={goToPage}
          />
        </div>
      </div>
    )
  },
}
