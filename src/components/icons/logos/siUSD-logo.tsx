import type { SVGProps } from 'react'
import { useId } from 'react'

export function siUSDLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()

  return (
    <svg
      className={className}
      width="404"
      height="404"
      viewBox="0 0 404 404"
      fill="none"
      role="img"
      aria-labelledby={logoId}
      {...props}
    >
      <title id={logoId}>siUSD Logo</title>
      <g clipPath={`url(#${logoId}-clip0_1032_620)`}>
        <mask
          id={`${logoId}-mask0_1032_620`}
          style={{ maskType: 'luminance' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="404"
          height="404"
        >
          <path d="M404 0H0V404H404V0Z" fill="white" />
        </mask>
        <g mask={`url(#${logoId}-mask0_1032_620)`}>
          <path
            d="M404 202C404 90.4385 313.562 0 202 0C90.4385 0 0 90.4385 0 202C0 313.562 90.4385 404 202 404C313.562 404 404 313.562 404 202Z"
            fill="white"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M80.7652 238.772C119.593 277.601 171.908 288.238 197.613 262.533C223.318 236.827 212.679 184.513 173.852 145.685C135.023 106.857 82.7091 96.2187 57.004 121.924C31.2989 147.629 41.937 199.943 80.7652 238.772ZM101.262 243.939C135.905 270.987 175.906 277.651 190.607 258.823C205.308 239.994 189.141 202.804 154.499 175.756C119.856 148.708 79.8554 142.044 65.1547 160.873C50.4537 179.701 66.6198 216.891 101.262 243.939Z"
            fill={`url(#${logoId}-paint0_linear_1032_620)`}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M323.235 166.964C284.407 128.136 232.093 117.498 206.386 143.203C180.682 168.908 191.32 221.222 230.148 260.051C268.976 298.879 321.29 309.516 346.996 283.812C372.701 258.107 362.064 205.792 323.235 166.964ZM303.144 162.191C268.501 135.143 228.501 128.479 213.8 147.308C199.099 166.136 215.264 203.327 249.907 230.375C284.55 257.423 324.55 264.087 339.252 245.258C353.953 226.43 337.787 189.239 303.144 162.191Z"
            fill={`url(#${logoId}-paint1_linear_1032_620)`}
          />
          <path
            d="M211.514 78.5511H249.841L193.414 325.446H155.086L211.514 78.5511Z"
            fill="#121113"
          />
        </g>
      </g>
      <defs>
        <linearGradient
          id={`${logoId}-paint0_linear_1032_620`}
          x1="145.389"
          y1="238.887"
          x2="167.255"
          y2="274.415"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.0726915" stopColor="#121113" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <linearGradient
          id={`${logoId}-paint1_linear_1032_620`}
          x1="250.485"
          y1="185.001"
          x2="236.745"
          y2="131.32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#121113" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <clipPath id={`${logoId}-clip0_1032_620`}>
          <rect width="404" height="404" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
