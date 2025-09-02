import { useId } from 'react'

export function USDCLogo({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="USDC Logo"
    >
      <title>USDC Logo</title>
      <g fill="none">
        <circle cx="16" cy="16" r="16" fill="#2775CA" />
        <circle cx="16" cy="16" r="12.5" fill="none" stroke="#FFF" strokeWidth="1" />
        <path
          fill="#FFF"
          d="M13.294 18.343c0 .747.596 1.353 1.331 1.353.736 0 1.332-.606 1.332-1.353v-.667h1.065v.694c0 1.306-1.072 2.373-2.397 2.373s-2.397-1.067-2.397-2.373v-4.686c0-1.306 1.072-2.374 2.397-2.374s2.397 1.068 2.397 2.374v.693h-1.065v-.667c0-.747-.596-1.353-1.332-1.353-.735 0-1.331.606-1.331 1.353v4.633z"
        />
        <path fill="#FFF" d="M11.5 15h9v1h-9v-1z" />
        <path fill="#FFF" d="M11.5 17h9v1h-9v-1z" />
        <text
          x="16"
          y="24"
          textAnchor="middle"
          fill="#FFF"
          fontSize="6"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
        >
          USD
        </text>
      </g>
    </svg>
  )
}

export function WETHLogo({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="WETH Logo"
    >
      <title>WETH Logo</title>
      <g fill="none" fillRule="evenodd">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <g fill="#FFF" fillRule="nonzero">
          <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602" />
          <path d="M16.498 4L9 16.22l7.498-3.35z" />
          <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602" />
          <path d="M16.498 27.995v-6.028L9 17.617z" />
          <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2" />
          <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".602" />
        </g>
      </g>
    </svg>
  )
}

export function WeETHLogo({ className = '', size = 32 }: { className?: string; size?: number }) {
  const gradientId = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="WeETH Logo"
    >
      <title>WeETH Logo</title>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <g fill="none" fillRule="evenodd">
        <circle cx="16" cy="16" r="16" fill={`url(#${gradientId})`} />
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
