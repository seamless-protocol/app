import type { SVGProps } from 'react'
import { useId } from 'react'

export function SeamlessLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()
  const gradientId = useId()

  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-labelledby={logoId}
      {...props}
    >
      <title id={logoId}>Seamless Protocol Logo</title>
      <defs>
        <radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(5.6 1.06513e-06) rotate(71.7371) scale(42.1217)"
        >
          <stop stopColor="#FFBFFF" />
          <stop offset="1" stopColor="#4F68F7" />
        </radialGradient>
      </defs>
      {/* Background circle with gradient fill */}
      <circle cx="16" cy="16" r="16" fill={`url(#${gradientId})`} />
      {/* "S" shape with solid white fill */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.0909 10.1811C14.1872 10.1811 13.4545 10.9137 13.4545 11.8175C13.4545 12.7212 14.1872 13.4538 15.0909 13.4538V18.9084C11.1747 18.9084 8 15.7337 8 11.8175C8 7.90127 11.1747 4.72656 15.0909 4.72656C19.0071 4.72656 22.1818 7.90127 22.1818 11.8175H16.7273C16.7273 10.9137 15.9946 10.1811 15.0909 10.1811ZM18.5455 20.545C18.5455 21.4488 17.8128 22.1814 16.9091 22.1814C16.0054 22.1814 15.2727 21.4488 15.2727 20.545H9.81818C9.81818 24.4612 12.9929 27.6359 16.9091 27.6359C20.8253 27.6359 24 24.4612 24 20.545C24 16.6288 20.8253 13.4541 16.9091 13.4541V18.9087C17.8128 18.9087 18.5455 19.6413 18.5455 20.545Z"
        fill="white"
      />
    </svg>
  )
}
