import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { cn } from './utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterDropdownProps {
  label: string
  value: string
  options: Array<FilterOption>
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function FilterDropdown({
  label,
  value,
  options,
  onValueChange,
  placeholder = 'Select...',
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className={cn('flex items-center space-x-2', className)} ref={dropdownRef}>
      <span className="text-sm font-medium text-slate-300">{label}:</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between bg-slate-800 border border-slate-600 text-white h-8 px-3 py-1 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-slate-700 min-w-[120px]"
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
          <ChevronDown
            className={cn('h-3 w-3 ml-2 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {isOpen && (
          <div
            role="menu"
            className="absolute top-full left-0 mt-1 z-50 min-w-[8rem] max-h-60 overflow-y-auto rounded-md border p-1 shadow-md bg-slate-800 border-slate-700 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            style={{ minWidth: '100%' }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                role="menuitem"
                tabIndex={0}
                onClick={() => {
                  onValueChange(option.value)
                  setIsOpen(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onValueChange(option.value)
                    setIsOpen(false)
                  }
                }}
                className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none cursor-pointer text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {typeof option.count === 'number' && (
                    <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium border-transparent bg-slate-700 text-slate-300 ml-2">
                      {option.count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
