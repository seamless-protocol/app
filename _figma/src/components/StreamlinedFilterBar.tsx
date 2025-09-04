"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"

import { 
  Search, 
  Filter, 
  ChevronDown,
  X,
  TrendingUp
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface SortOption {
  value: string
  label: string
}

interface StreamlinedFilterBarProps {
  // Search
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  
  // Primary filter (e.g., Collateral Asset)
  primaryFilter: {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }
  
  // Secondary filter (e.g., Debt Asset)
  secondaryFilter: {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }
  
  // Tertiary filter (e.g., Supply Cap)
  tertiaryFilter: {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }
  
  // Sort functionality (optional)
  sortBy?: string
  sortOptions?: SortOption[]
  onSortChange?: (value: string) => void
  
  // Results info
  resultsCount: number
  totalCount: number
  itemLabel: string // "vaults", "leverage tokens"
}

export function StreamlinedFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Filter items",
  primaryFilter,
  secondaryFilter,
  tertiaryFilter,
  sortBy,
  sortOptions,
  onSortChange,
  resultsCount,
  totalCount,
  itemLabel
}: StreamlinedFilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const hasActiveFilters = primaryFilter.value !== 'all' || 
    secondaryFilter.value !== 'all' || 
    tertiaryFilter.value !== 'all' || 
    searchQuery.length > 0

  const clearAllFilters = () => {
    onSearchChange('')
    primaryFilter.onChange('all')
    secondaryFilter.onChange('all')
    tertiaryFilter.onChange('all')
  }

  return (
    <motion.div
      className="bg-slate-900/80 border border-slate-700 rounded-lg p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Filter Row */}
      <div className="flex items-center justify-between space-x-4">
        {/* Left Side - Filters */}
        <div className="flex items-center space-x-6">
          {/* Primary Filter Dropdown - Collateral Asset */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-300">{primaryFilter.label}:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-600"
                >
                  <span className="mr-2">
                    {primaryFilter.options.find(opt => opt.value === primaryFilter.value)?.label || 'All'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                {primaryFilter.options.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => primaryFilter.onChange(option.value)}
                    className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Secondary Filter Dropdown - Debt Asset */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-300">{secondaryFilter.label}:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-600"
                >
                  <span className="mr-2">
                    {secondaryFilter.options.find(opt => opt.value === secondaryFilter.value)?.label || 'All'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                {secondaryFilter.options.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => secondaryFilter.onChange(option.value)}
                    className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tertiary Filter Dropdown - Supply Cap */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-300">{tertiaryFilter.label}:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-600"
                >
                  <span className="mr-2">
                    {tertiaryFilter.options.find(opt => opt.value === tertiaryFilter.value)?.label || 'All'}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                {tertiaryFilter.options.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => tertiaryFilter.onChange(option.value)}
                    className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <Badge variant="secondary" className="ml-2 bg-slate-700 text-slate-300">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sort Dropdown - Only show if sort options are provided */}
          {sortOptions && sortBy !== undefined && onSortChange && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Sort by:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-600"
                  >
                    <span className="mr-2">
                      {sortOptions.find(opt => opt.value === sortBy)?.label || 'Default'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => onSortChange(option.value)}
                      className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                    >
                      <span>{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Right Side - Search and Clear */}
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`pl-10 w-64 bg-slate-800 border-slate-600 text-white h-8 transition-all duration-200 ${
                isSearchFocused ? 'ring-2 ring-purple-500 border-purple-500 w-80' : ''
              }`}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-3 text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <motion.div
          className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-400">
              Showing <span className="text-white font-medium">{resultsCount}</span> of <span className="text-white font-medium">{totalCount}</span> {itemLabel}
            </span>
            {searchQuery && (
              <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600">
                Search: "{searchQuery}"
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {primaryFilter.value !== 'all' && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {primaryFilter.options.find(opt => opt.value === primaryFilter.value)?.label}
              </Badge>
            )}
            {secondaryFilter.value !== 'all' && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {secondaryFilter.options.find(opt => opt.value === secondaryFilter.value)?.label}
              </Badge>
            )}
            {tertiaryFilter.value !== 'all' && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {tertiaryFilter.options.find(opt => opt.value === tertiaryFilter.value)?.label}
              </Badge>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}