import type { SVGProps } from 'react'
import { useId } from 'react'

export function MorphoLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const titleId = useId()
  const gradientId = useId()

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={titleId}
      {...props}
    >
      <title id={titleId}>Morpho Logo</title>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${gradientId})`} />
      <path
        d="M15 32V16.5c0-1.1.9-2 2-2h1.4c.8 0 1.5.4 1.9 1.1l4.6 8.1 4.6-8.1c.4-.7 1.1-1.1 1.9-1.1H32c1.1 0 2 .9 2 2V32h-3.8V21.7l-4.6 8.2c-.4.7-1.1 1.1-1.9 1.1h-.4c-.8 0-1.5-.4-1.9-1.1l-4.6-8.1V32H15Z"
        fill="#0f172a"
      />
    </svg>
  )
}
