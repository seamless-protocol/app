import type { SVGProps } from 'react'
import { useId } from 'react'

export function BaseLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()
  const pathId = useId()

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
      <title id={logoId}>Base Logo</title>
      <g id={logoId}>
        <path
          d="M15.6687 31.4759C24.3526 31.5223 31.4297 24.5325 31.476 15.8638C31.5223 7.19505 24.5203 0.130068 15.8364 0.0836869C7.59767 0.0396838 0.805128 6.32901 0.0908798 14.3767L20.8737 14.4878L20.8596 17.1265L0.0767865 17.0155C0.705031 25.0704 7.43001 31.4319 15.6687 31.4759Z"
          fill="var(--fill-0, #2151F5)"
          id={pathId}
        />
      </g>
    </svg>
  )
}
