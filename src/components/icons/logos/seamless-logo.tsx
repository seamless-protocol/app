import type { SVGProps } from 'react'
import { useId } from 'react'

export function SeamlessLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()
  const pathId = useId()

  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 24 24"
      role="img"
      aria-labelledby={logoId}
      {...props}
    >
      <title id={logoId}>Seamless Protocol Logo</title>
      <g id={logoId}>
        <circle cx="12" cy="12" r="12" fill="var(--logo-bg)" />
        <path
          d="M12.6445 13.9438C13.094 14.0237 13.4354 14.4158 13.4355 14.8882C13.4355 15.4184 13.0058 15.8481 12.4756 15.8481C11.9631 15.8481 11.5459 15.4466 11.5186 14.9409H7.52441V14.8423C7.52361 14.8765 7.52151 14.9114 7.52148 14.9458C7.52148 17.5559 9.81396 19.6723 12.6416 19.6724C15.4693 19.6724 17.7617 17.556 17.7617 14.9458C17.7612 12.3369 15.4706 10.2226 12.6445 10.2212V13.9438ZM11.3584 4.32764C8.5307 4.32764 6.23828 6.44403 6.23828 9.0542C6.23862 11.6641 8.53091 13.7798 11.3584 13.7798L11.3594 13.7788V10.064C10.9071 9.98639 10.5626 9.59405 10.5625 9.11963C10.5625 8.58947 10.9923 8.15969 11.5225 8.15967C12.0323 8.15967 12.4482 8.55715 12.4795 9.05908H16.4785C16.4785 9.0575 16.4785 9.05578 16.4785 9.0542C16.4785 6.44406 14.186 4.3277 11.3584 4.32764Z"
          fill="var(--logo-icon)"
          id={pathId}
        ></path>
      </g>
    </svg>
  )
}
