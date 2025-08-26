import { useId } from 'react'

export function rETHLogo({ className }: { className?: string }) {
  const logoId = useId()

  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 32 32"
      role="img"
      aria-labelledby={logoId}
    >
      <title id={logoId}>rETH Logo</title>
      <g fill="none">
        <circle cx="16" cy="16" r="16" fill="#FF6B35" />
        <g fill="#FFF">
          <path d="M16 3l9 6-9 5.5L7 9l9-6zm0 14L7 12v8l9 5.5V17zm9-5v8l-9 5.5V17l9-5z" />
          <path d="M16 8.5L12 11v6l4 2.5 4-2.5v-6l-4-2.5z" fillOpacity=".8" />
        </g>
      </g>
    </svg>
  )
}
