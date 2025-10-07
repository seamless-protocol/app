import type * as React from 'react'

type SVGProps = React.SVGProps<SVGSVGElement>

export function XLogo({ className, ...props }: SVGProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M89.53 8H104L68.64 50.02 110 112H78.02L53.77 76.65 25.4 112H11.03L49.4 67.56 8 8h32.76l21.3 31.38L89.53 8Zm-5.53 93.2h7.35L35.7 16.8h-7.56l55.86 84.4Z" />
    </svg>
  )
}

export default XLogo
