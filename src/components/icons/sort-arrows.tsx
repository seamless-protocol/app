interface SortArrowProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function SortArrowNeutral({ className = '', size = 'sm' }: SortArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-arrow-up-down ${sizeClasses[size]} text-[var(--text-muted)] ${className}`}
      aria-hidden="true"
    >
      <path d="m21 16-4 4-4-4"></path>
      <path d="M17 20V4"></path>
      <path d="m3 8 4-4 4 4"></path>
      <path d="M7 4v16"></path>
    </svg>
  )
}

export function SortArrowUp({ className = '', size = 'sm' }: SortArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-arrow-up ${sizeClasses[size]} text-[var(--brand-secondary)] ${className}`}
      aria-hidden="true"
    >
      <path d="m5 12 7-7 7 7"></path>
      <path d="M12 19V5"></path>
    </svg>
  )
}

export function SortArrowDown({ className = '', size = 'sm' }: SortArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-arrow-down ${sizeClasses[size]} text-[var(--brand-secondary)] ${className}`}
      aria-hidden="true"
    >
      <path d="M12 5v14"></path>
      <path d="m19 12-7 7-7-7"></path>
    </svg>
  )
}
