"use client"

import { motion } from "motion/react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "./ui/button"

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  isActive?: boolean
}

interface StrategyBreadcrumbProps {
  items: BreadcrumbItem[]
  onBack?: () => void
  className?: string
}

export function StrategyBreadcrumb({ 
  items, 
  onBack, 
  className = "" 
}: StrategyBreadcrumbProps) {
  return (
    <motion.div
      className={`flex items-center space-x-4 mb-6 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back Button */}
      {onBack && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors px-2 py-2 h-9"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              className="contents"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <BreadcrumbItem>
                {item.isActive ? (
                  <BreadcrumbPage className="text-white font-medium">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={item.onClick}
                    className="text-slate-400 hover:text-purple-400 transition-colors font-medium"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && item.onClick) {
                        e.preventDefault()
                        item.onClick()
                      }
                    }}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {index < items.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </BreadcrumbSeparator>
              )}
            </motion.div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  )
}