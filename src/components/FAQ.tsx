import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'

export interface FAQItem {
  id: string
  question: string
  answer: string
}

interface FAQProps {
  title?: string
  items: Array<FAQItem>
  className?: string
}

export function FAQ({ title = 'Frequently Asked Questions', items, className = '' }: FAQProps) {
  const [openFAQs, setOpenFAQs] = useState<Array<string>>([])

  const toggleFAQ = (faqId: string) => {
    setOpenFAQs((prev) =>
      prev.includes(faqId) ? prev.filter((id) => id !== faqId) : [...prev, faqId],
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn('border border-border bg-card text-foreground', className)}>
        <CardHeader>
          <CardTitle className="text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((faq) => (
            <Collapsible
              key={faq.id}
              open={openFAQs.includes(faq.id)}
              onOpenChange={() => toggleFAQ(faq.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between rounded-lg border border-border bg-accent p-4 text-left text-foreground transition-colors hover:bg-accent"
                >
                  <span className="pr-2 break-words text-left font-medium text-foreground">
                    {faq.question}
                  </span>
                  {openFAQs.includes(faq.id) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded-lg border border-border bg-accent p-4">
                  <p className="leading-relaxed text-secondary-foreground">{faq.answer}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
