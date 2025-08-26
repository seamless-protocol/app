import { useId } from 'react'

interface EthereumLogoProps {
  className?: string
}

export function EthereumLogo({ className }: EthereumLogoProps) {
  const logoId = useId()
  const path1Id = useId()
  const path2Id = useId()
  const path3Id = useId()
  const path4Id = useId()
  const path5Id = useId()
  const path6Id = useId()

  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 32 32"
      role="img"
      aria-labelledby={logoId}
    >
      <title id={logoId}>Ethereum Logo</title>
      <g id={logoId} fill="none" fillRule="evenodd">
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <g fill="#FFF" fillRule="nonzero">
          <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity="0.602" id={path1Id} />
          <path d="M16.498 4L9 16.22l7.498-3.35z" id={path2Id} />
          <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity="0.602" id={path3Id} />
          <path d="M16.498 27.995v-6.028L9 17.617z" id={path4Id} />
          <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity="0.2" id={path5Id} />
          <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity="0.602" id={path6Id} />
        </g>
      </g>
    </svg>
  )
}
