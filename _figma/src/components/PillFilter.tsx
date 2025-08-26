"use client"

import { motion } from "motion/react"
import { ReactNode } from "react"

interface PillFilterOption {
  id: string
  name: string
  count?: number
  icon?: ReactNode
}

interface PillFilterProps {
  options: PillFilterOption[]
  activeValue: string
  onValueChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showCounts?: boolean
}

export function PillFilter({ 
  options, 
  activeValue, 
  onValueChange, 
  className = '',
  size = 'md',
  showCounts = true
}: PillFilterProps) {
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  }

  const countSizeClasses = {
    sm: 'ml-1 px-1.5 py-0.5 text-xs',
    md: 'ml-2 px-2 py-1 text-xs',
    lg: 'ml-3 px-2.5 py-1.5 text-sm'
  }

  return (
    <div className={`flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start ${className}`}>
      {options.map((option, index) => (
        <motion.button
          key={option.id}
          onClick={() => onValueChange(option.id)}
          className={`
            relative inline-flex items-center rounded-full font-medium transition-all duration-200 ease-in-out
            ${sizeClasses[size]}
            ${activeValue === option.id 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 border-transparent' 
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-600/50 hover:border-slate-500/70 hover:shadow-md'
            }
          `}
          whileHover={{ 
            scale: 1.05,
            y: -1
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.05,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          aria-pressed={activeValue === option.id}
          role="tab"
        >
          {/* Icon */}
          {option.icon && (
            <span className={`
              ${option.name && showCounts && option.count !== undefined ? 'mr-2' : 
                option.name ? 'mr-1' : ''}
            `}>
              {option.icon}
            </span>
          )}
          
          {/* Label */}
          <span className="relative z-10 whitespace-nowrap">{option.name}</span>
          
          {/* Count Badge */}
          {showCounts && option.count !== undefined && (
            <motion.div 
              className={`
                rounded-full font-medium min-w-[20px] text-center
                ${countSizeClasses[size]}
                ${activeValue === option.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-700 text-slate-400'
                }
              `}
              layout
              transition={{ duration: 0.2 }}
            >
              {option.count}
            </motion.div>
          )}
          
          {/* Active indicator background with glow effect */}
          {activeValue === option.id && (
            <>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                layoutId="activePillFilter"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                style={{ zIndex: -1 }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ zIndex: -2 }}
              />
            </>
          )}
        </motion.button>
      ))}
    </div>
  )
}