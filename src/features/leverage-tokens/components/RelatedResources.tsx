import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useState } from 'react'
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
  icon: React.ComponentType<{ className?: string }>
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

  const getBadgeClasses = (color: ResourceItem['badge']['color']) => {
    const colorMap = {
      amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      red: 'bg-red-500/10 text-red-300 border-red-500/20',
      green: 'bg-green-500/10 text-green-300 border-green-500/20',
      yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
      indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      pink: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
      gray: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
    }
    return colorMap[color]
  }

  const getIconBgClasses = (color: ResourceItem['badge']['color']) => {
    const colorMap = {
      amber: 'bg-amber-500/20 group-hover:bg-amber-500/30',
      blue: 'bg-blue-500/20 group-hover:bg-blue-500/30',
      emerald: 'bg-emerald-500/20 group-hover:bg-emerald-500/30',
      purple: 'bg-purple-500/20 group-hover:bg-purple-500/30',
      red: 'bg-red-500/20 group-hover:bg-red-500/30',
      green: 'bg-green-500/20 group-hover:bg-green-500/30',
      yellow: 'bg-yellow-500/20 group-hover:bg-yellow-500/30',
      indigo: 'bg-indigo-500/20 group-hover:bg-indigo-500/30',
      pink: 'bg-pink-500/20 group-hover:bg-pink-500/30',
      gray: 'bg-gray-500/20 group-hover:bg-gray-500/30',
    }
    return colorMap[color]
  }

  const getIconColorClasses = (color: ResourceItem['badge']['color']) => {
    const colorMap = {
      amber: 'text-amber-400',
      blue: 'text-blue-400',
      emerald: 'text-emerald-400',
      purple: 'text-purple-400',
      red: 'text-red-400',
      green: 'text-green-400',
      yellow: 'text-yellow-400',
      indigo: 'text-indigo-400',
      pink: 'text-pink-400',
      gray: 'text-gray-400',
    }
    return colorMap[color]
  }

  const getHoverColorClasses = (color: ResourceItem['badge']['color']) => {
    const colorMap = {
      amber: 'group-hover:text-amber-200',
      blue: 'group-hover:text-blue-200',
      emerald: 'group-hover:text-emerald-200',
      purple: 'group-hover:text-purple-200',
      red: 'group-hover:text-red-200',
      green: 'group-hover:text-green-200',
      yellow: 'group-hover:text-yellow-200',
      indigo: 'group-hover:text-indigo-200',
      pink: 'group-hover:text-pink-200',
      gray: 'group-hover:text-gray-200',
    }
    return colorMap[color]
  }

  const getBorderHoverClasses = (color: ResourceItem['badge']['color']) => {
    const colorMap = {
      amber: 'hover:border-amber-500/50',
      blue: 'hover:border-blue-500/50',
      emerald: 'hover:border-emerald-500/50',
      purple: 'hover:border-purple-500/50',
      red: 'hover:border-red-500/50',
      green: 'hover:border-green-500/50',
      yellow: 'hover:border-yellow-500/50',
      indigo: 'hover:border-indigo-500/50',
      pink: 'hover:border-pink-500/50',
      gray: 'hover:border-gray-500/50',
    }
    return colorMap[color]
  }

  const renderResourceItem = (item: ResourceItem) => {
    const Icon = item.icon
    return (
      <a
        key={item.id}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group block p-4 border rounded-lg transition-all duration-200 ${
          item.highlight
            ? 'bg-slate-800/70 hover:bg-slate-800/90 border-slate-600 ring-1 ring-slate-600/50'
            : 'bg-slate-800/50 hover:bg-slate-800/70 border-slate-700'
        } hover:border-slate-600 ${getBorderHoverClasses(item.badge.color)}`}
      >
        <div className="flex items-start space-x-3">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${getIconBgClasses(
              item.badge.color,
            )}`}
          >
            <Icon className={`w-6 h-6 ${getIconColorClasses(item.badge.color)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4
                className={`font-medium text-white transition-colors ${getHoverColorClasses(
                  item.badge.color,
                )}`}
              >
                {item.title}
              </h4>
              <ExternalLink
                className={`w-4 h-4 text-slate-400 transition-all duration-200 ${getHoverColorClasses(
                  item.badge.color,
                )} group-hover:translate-x-0.5`}
              />
            </div>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors mb-3 leading-relaxed">
              {item.description}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`text-xs ${getBadgeClasses(item.badge.color)}`}>
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
        <h3 className="text-white font-medium text-sm uppercase tracking-wide">{category.title}</h3>
        <div className="flex-1 h-px bg-slate-700"></div>
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
        className={`text-card-foreground flex flex-col gap-6 rounded-xl border bg-slate-900/80 border-slate-700 ${className}`}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 cursor-pointer hover:bg-slate-800/30 transition-colors rounded-t-lg px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h4 className="leading-none text-white">Related Resources</h4>
                  <p className="text-slate-400 text-sm">
                    Explore external platforms and tools related to this strategy
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&]:hover:bg-accent [a&]:hover:text-accent-foreground bg-slate-800/50 text-slate-400 border-slate-600 text-xs"
                  >
                    {isOpen ? 'Hide Resources' : 'Show Resources'}
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-6 [&:last-child]:pb-6 space-y-6 pt-0">
              {categories.map(renderCategory)}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}
