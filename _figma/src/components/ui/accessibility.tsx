import { useEffect, useRef } from "react"

// Skip Links Component for keyboard navigation
export function SkipNavigation() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-brand-purple text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-purple"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-4 left-32 z-50 px-4 py-2 bg-brand-purple text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-purple"
      >
        Skip to navigation
      </a>
    </div>
  )
}

// Announce live region for screen readers
export function LiveRegion({ children, priority = "polite" }: { 
  children: React.ReactNode
  priority?: "polite" | "assertive" | "off"
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Focus trap for modals and dialogs
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (!firstElement) return

    // Focus first element when trap activates
    firstElement.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }, [isActive])

  return containerRef
}

// Screen reader announcements
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Accessible button component
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  variant = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  variant?: "default" | "primary" | "secondary" | "ghost"
  className?: string
  [key: string]: any
}) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variantClasses = {
    default: "bg-dark-card hover:bg-dark-elevated text-dark-primary focus:ring-brand-purple",
    primary: "bg-gradient-violet hover:shadow-lg text-white focus:ring-white",
    secondary: "border border-divider-line hover:bg-dark-elevated text-dark-secondary focus:ring-brand-purple",
    ghost: "hover:bg-dark-elevated text-dark-secondary hover:text-dark-primary focus:ring-brand-purple"
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Keyboard navigation helpers
export function useKeyboardNavigation(
  items: string[],
  onItemSelect: (item: string) => void,
  isActive: boolean = true
) {
  const currentIndexRef = useRef(0)

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          currentIndexRef.current = (currentIndexRef.current + 1) % items.length
          break
        case 'ArrowUp':
          e.preventDefault()
          currentIndexRef.current = currentIndexRef.current === 0 ? items.length - 1 : currentIndexRef.current - 1
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onItemSelect(items[currentIndexRef.current])
          break
        case 'Home':
          e.preventDefault()
          currentIndexRef.current = 0
          break
        case 'End':
          e.preventDefault()
          currentIndexRef.current = items.length - 1
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, onItemSelect, isActive])

  return currentIndexRef.current
}