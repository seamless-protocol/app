import { useId } from 'react'

export function weETHLogo({ className }: { className?: string }) {
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
      <title id={logoId}>weETH Logo</title>
      <defs>
        <linearGradient id={`${logoId}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <g fill="none" fillRule="evenodd">
        <circle cx="16" cy="16" r="16" fill="url(#weethGradient)" />
        <g fill="#FFF" fillRule="nonzero">
          <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".8" />
          <path d="M16.498 4L9 16.22l7.498-3.35z" />
          <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".8" />
          <path d="M16.498 27.995v-6.028L9 17.617z" />
          <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".3" />
          <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".8" />
        </g>
      </g>
    </svg>
  )
}
