import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
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
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {label && <span className="text-sm font-medium text-[var(--text-secondary)]">{label}:</span>}
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:not([class*='size-']):size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 rounded-md gap-1.5 has-[>svg]:px-2.5 h-8 px-3 border border-[var(--divider-line)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 50%,var(--surface-card) 50%)]"
          >
            <span className="mr-2 truncate max-w-[9rem]">
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            className="text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md border-[var(--divider-line)] bg-[var(--surface-card)]"
            sideOffset={5}
          >
            {options.map((option) => (
              <DropdownMenuPrimitive.Item
                key={option.value}
                onClick={() => onValueChange(option.value)}
                className="relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 40%,var(--surface-card) 60%)] cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {typeof option.count === 'number' && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-elevated) 40%,var(--surface-card) 60%)] text-[var(--text-secondary)]">
                      {option.count}
                    </span>
                  )}
                </div>
              </DropdownMenuPrimitive.Item>
            ))}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  )
}
