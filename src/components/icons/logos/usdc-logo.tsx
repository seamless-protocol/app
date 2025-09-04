import type { SVGProps } from 'react'
import { useId } from 'react'

export function USDCLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()

  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 32 32"
      role="img"
      aria-labelledby={logoId}
      {...props}
    >
      <title id={logoId}>USDC Logo</title>
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
