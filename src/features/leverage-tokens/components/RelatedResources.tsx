import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { ComponentType, CSSProperties } from 'react'
import { useState } from 'react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { cn } from '@/lib/utils/cn'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible'

interface ResourceItem {
  id: string
  title: string
  description: string
  url: string
  icon: ComponentType<{ className?: string }>
  getUrl?: (ctx: { address?: Address }) => string
  badge: {
    text: string
    color:
      | 'amber'
      | 'blue'
      | 'emerald'
      | 'purple'
      | 'red'
      | 'green'
      | 'yellow'
      | 'indigo'
      | 'pink'
      | 'gray'
  }
  highlight?: boolean
}

interface ResourceCategory {
  title: string
  items: Array<ResourceItem>
}

interface RelatedResourcesProps {
  underlyingPlatforms: Array<ResourceItem>
  additionalRewards: Array<ResourceItem>
  className?: string
}

export function RelatedResources({
  underlyingPlatforms,
  additionalRewards,
  className,
}: RelatedResourcesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { address } = useAccount()

  const resourceColorTokens: Record<ResourceItem['badge']['color'], string> = {
    amber: 'var(--state-warning-text)',
    blue: 'var(--brand-primary)',
    emerald: 'var(--state-success-text)',
    purple: 'var(--brand-secondary)',
    red: 'var(--state-error-text)',
    green: 'var(--state-success-text)',
    yellow: 'var(--state-warning-text)',
    indigo: 'var(--brand-tertiary)',
    pink: 'var(--accent-2)',
    gray: 'var(--text-secondary)',
  }

  const buildResourceStyles = (color: ResourceItem['badge']['color']): CSSProperties => {
    const baseColor = resourceColorTokens[color] ?? 'var(--brand-primary)'

    return {
      '--resource-color': baseColor,
      '--resource-bg': `color-mix(in srgb, ${baseColor} 12%, var(--surface-card))`,
      '--resource-hover-bg': `color-mix(in srgb, ${baseColor} 20%, var(--surface-card))`,
      '--resource-border': `color-mix(in srgb, ${baseColor} 32%, transparent)`,
      '--resource-hover-border': `color-mix(in srgb, ${baseColor} 48%, transparent)`,
      '--resource-icon-bg': `color-mix(in srgb, ${baseColor} 18%, transparent)`,
      '--resource-icon-hover-bg': `color-mix(in srgb, ${baseColor} 28%, transparent)`,
      '--resource-badge-bg': `color-mix(in srgb, ${baseColor} 10%, transparent)`,
    } as CSSProperties
  }

  const renderResourceItem = (item: ResourceItem) => {
    const Icon = item.icon
    const href = item.getUrl ? (address ? item.getUrl({ address }) : item.getUrl({})) : item.url
    return (
      <a
        key={item.id}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={buildResourceStyles(item.badge.color)}
        className={cn(
          'group block rounded-lg border p-4 transition-all duration-200 border-[var(--resource-border)] bg-[var(--resource-bg)] hover:border-[var(--resource-hover-border)] hover:bg-[var(--resource-hover-bg)]',
          item.highlight && 'shadow-[0_12px_40px_-24px_var(--resource-color)]',
        )}
      >
        <div className="flex items-start space-x-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--resource-icon-bg)] transition-colors group-hover:bg-[var(--resource-icon-hover-bg)]">
            <Icon className="h-6 w-6 text-[var(--resource-color)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground transition-colors group-hover:text-[var(--resource-color)]">
                {item.title}
              </h4>
              <ExternalLink className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--resource-color)]" />
            </div>
            <p className="mb-3 text-sm leading-relaxed text-secondary-foreground transition-colors group-hover:text-foreground">
              {item.description}
            </p>
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="text-xs border-[var(--resource-border)] bg-[var(--resource-badge-bg)] text-[var(--resource-color)]"
              >
                {item.badge.text}
              </Badge>
            </div>
          </div>
        </div>
      </a>
    )
  }

  const renderCategory = (category: ResourceCategory) => (
    <div key={category.title} className="space-y-4">
      <div className="flex items-center space-x-2">
        <h3 className="text-sm font-medium uppercase tracking-wide text-foreground">
          {category.title}
        </h3>
        <div className="flex-1 h-px bg-[var(--divider-line)]" />
      </div>
      <div className="grid grid-cols-1 gap-3">{category.items.map(renderResourceItem)}</div>
    </div>
  )

  const categories = [
    {
      title: 'Underlying Platforms & Markets',
      items: underlyingPlatforms,
    },
    {
      title: 'Additional Rewards & Yields',
      items: additionalRewards,
    },
  ].filter((category) => category.items.length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          'flex flex-col gap-6 rounded-xl border border-border bg-card text-foreground',
          className,
        )}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 cursor-pointer rounded-t-lg px-6 py-6 transition-colors hover:bg-accent">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="space-y-2">
                  <h4 className="leading-none text-foreground">Related Resources</h4>
                  <p className="text-sm text-secondary-foreground">
                    Explore external platforms and tools related to this strategy
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    {isOpen ? 'Hide Resources' : 'Show Resources'}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6 px-6 pt-0 [&:last-child]:pb-6">
              {categories.map(renderCategory)}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}
