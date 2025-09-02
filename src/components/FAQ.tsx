'use client'

import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
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
      <Card className={`bg-slate-900/80 border-slate-700 ${className}`}>
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
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
                  className="w-full justify-between p-4 text-left bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 hover:border-slate-600 rounded-lg"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  {openFAQs.includes(faq.id) ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                  <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
