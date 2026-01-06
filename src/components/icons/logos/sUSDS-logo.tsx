import type { SVGProps } from 'react'
import { useId } from 'react'

export function sUSDSLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <title id={logoId}>sUSDS Logo</title>
      <g clipPath={`url(#${logoId}-clip0_1978_60)`}>
        <mask
          id={`${logoId}-mask0_1978_60`}
          style={{ maskType: 'luminance' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="404"
          height="404"
        >
          <path d="M404 0H0V404H404V0Z" fill="white" />
        </mask>
        <g mask={`url(#${logoId}-mask0_1978_60)`}>
          <g transform="scale(12.625)">
            <path
              d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z"
              fill={`url(#${logoId}-paint0_radial_1978_60)`}
            />
            <path
              d="M9.88051 20.2055H7.60352C7.78943 23.7603 10.7634 26.8504 16.0375 26.8504C21.2884 26.8504 24.634 23.9694 24.634 20.252C24.634 13.1889 13.9697 13.5838 13.9697 9.49468C13.9697 8.35622 14.8293 7.00867 16.8274 7.00867C19.0579 7.00867 21.6833 8.75116 21.8692 10.9817H24.1229C23.8906 7.38036 20.3822 4.87109 15.9213 4.87109C11.2977 4.87109 7.81268 7.56627 7.81268 11.3766C7.81268 18.6489 18.477 17.6963 18.477 22.1804C18.477 23.5745 17.6174 24.7361 15.4566 24.7361C12.7615 24.7361 10.0431 22.8542 9.88051 20.2055ZM11.7857 10.029C11.7857 15.5588 22.3571 14.4667 22.3571 20.3682C22.3571 22.1339 21.1954 23.6906 19.8014 24.0856C20.2893 23.6209 20.661 22.5986 20.661 21.6228C20.661 16.1628 10.0664 16.9063 10.0664 11.3069C10.0664 9.42501 11.2745 7.91479 12.7847 7.4501C12.2039 8.14713 11.7857 9.05325 11.7857 10.029Z"
              fill="white"
            />
          </g>
        </g>
      </g>
      <defs>
        <radialGradient
          id={`${logoId}-paint0_radial_1978_60`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(16.0013 49.8423) rotate(-90) scale(49.8401)"
        >
          <stop offset="5.6694e-08" stopColor="#FFEF79" />
          <stop offset="1" stopColor="#00C2A1" />
        </radialGradient>
        <clipPath id={`${logoId}-clip0_1978_60`}>
          <rect width="404" height="404" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
