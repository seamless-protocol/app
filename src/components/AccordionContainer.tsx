import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from './ui/utils'

export interface AccordionItemData {
  id: string
  title: string
  description: string
}

export interface AccordionContainerData {
  title: string
  description?: string
  items: Array<AccordionItemData>
}

interface AccordionContainerProps {
  data: AccordionContainerData
  className?: string
  defaultOpenItems?: Array<string>
  allowMultiple?: boolean
}

interface AccordionItemProps {
  item: AccordionItemData
  isOpen: boolean
  onToggle: () => void
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="text-left font-medium text-white">{item.title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-slate-400" />
        </motion.div>
      </button>

      <motion.div
        className="overflow-hidden"
        animate={{
          height: isOpen ? contentRef.current?.scrollHeight || 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.25,
          ease: 'easeOut',
        }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          <p className="text-slate-400 leading-relaxed mt-2">
            {item.description.split('\n').map((paragraph, paragraphIndex) => (
              <span key={paragraph || `empty-${paragraphIndex}`}>
                {paragraph}
                {paragraphIndex < item.description.split('\n').length - 1 && <br />}
                {paragraphIndex < item.description.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export function AccordionContainer({
  data,
  className,
  defaultOpenItems = [],
  allowMultiple = true,
  ...props
}: AccordionContainerProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set(defaultOpenItems))

  const toggleItem = React.useCallback(
    (itemId: string) => {
      setOpenItems((prev) => {
        const newSet = new Set(prev)

        if (!allowMultiple && !newSet.has(itemId)) {
          // If single mode and opening a new item, close all others
          newSet.clear()
          newSet.add(itemId)
        } else if (newSet.has(itemId)) {
          newSet.delete(itemId)
        } else {
          newSet.add(itemId)
        }

        return newSet
      })
    },
    [allowMultiple],
  )

  return (
    <Card className={cn('w-full bg-slate-900/80 border-slate-700', className)} {...props}>
      <CardHeader>
        <CardTitle className="text-lg text-white">{data.title}</CardTitle>
        {data.description && <p className="text-slate-400 mt-2">{data.description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.items.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
