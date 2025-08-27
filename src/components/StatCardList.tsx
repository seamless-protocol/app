import type { StatCardProps } from './StatCard'
import { StatCard } from './StatCard'
import { cn } from './ui/utils'

export interface StatCardListProps {
  cards: Array<StatCardProps>
  maxColumns?: 2 | 3 | 4
  className?: string
}

function StatCardList({ cards, maxColumns = 4, className }: StatCardListProps) {
  // Smart grid column calculation
  const getGridColumns = (cardCount: number, maxCols: number) => {
    if (cardCount <= maxCols) {
      return cardCount
    }

    // For more than maxColumns, try to distribute evenly
    if (cardCount === 6 && maxCols >= 3) {
      return 3 // 2 rows of 3
    }

    if (cardCount === 5) {
      return maxCols >= 3 ? 3 : 2 // 3+2 or 3+2 layout
    }

    return maxCols
  }

  const columns = getGridColumns(cards.length, maxColumns)

  const gridColsClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div data-slot="stat-card-list" className={cn('grid gap-4', gridColsClass, className)}>
      {cards.map((card, index) => (
        <StatCard key={`${card.title}-${index}`} {...card} />
      ))}
    </div>
  )
}

export { StatCardList }
