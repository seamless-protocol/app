import type { SVGProps } from 'react'
import { useId } from 'react'

export function wstETHLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <title id={logoId}>wstETH Logo</title>
      <g fill="none" fillRule="evenodd">
        <circle cx="16" cy="16" r="16" fill="#00A3FF" />
        <g fill="#FFF" fillRule="nonzero">
          <path
            opacity="0.6"
            d="m22.563 14.863 0.179 0.275c2.02 3.099 1.569 7.158-1.085 9.758-1.561 1.53-3.608 2.295-5.655 2.296l6.561-12.329Z"
            fill="#fff"
          />
          <path opacity="0.2" d="M16.003 18.61 22.563 14.863 16.003 27.192V18.61Z" fill="#fff" />
          <path
            d="m9.437 14.863-0.179 0.275c-2.02 3.099-1.569 7.158 1.085 9.758 1.561 1.53 3.608 2.295 5.655 2.296L9.437 14.863Z"
            fill="#fff"
          />
          <path opacity="0.6" d="m15.995 18.61-6.561-3.747 6.561 12.329V18.61Z" fill="#fff" />
          <path opacity="0.2" d="M16.005 10.24v6.463l5.65-3.229-5.65-3.234Z" fill="#fff" />
          <path opacity="0.6" d="m16.003 10.24-5.655 3.233 5.655 3.23v-6.463Z" fill="#fff" />
          <path d="m16.003 4.805-5.655 8.67 5.655-3.243V4.805Z" fill="#fff" />
          <path opacity="0.6" d="m16.005 10.232 5.655 3.243-5.655-8.67v5.427Z" fill="#fff" />
        </g>
      </g>
    </svg>
  )
}
