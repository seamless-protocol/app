import type { SVGProps } from 'react'
import { useId } from 'react'

export function MerklLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const titleId = useId()

  return (
    <svg
      className={className}
      viewBox="0 0 800 724.45"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={titleId}
      {...props}
    >
      <title id={titleId}>Merkl Logo</title>
      {/* Light theme version - black fill (default) */}
      <polygon
        className="fill-black dark:fill-white"
        points="405.7 149 545.6 149 405.7 530.9 204.9 0 1 0 0 396.3 148 396.3 148 239.1 336.4 724.5 462.6 724.5 651 239.1 651 724.5 800 724.5 800 149 800 0 800 0 405.7 0 405.7 149"
      />
      <path
        className="fill-black dark:fill-white"
        d="M0,546.5v178l57-20.6c54.6-19.7,91-71.5,91-129.6v-178l-57,20.6C36.4,436.6,0,488.5,0,546.5Z"
      />
    </svg>
  )
}
