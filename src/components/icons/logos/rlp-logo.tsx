import type { SVGProps } from 'react'
import { useId } from 'react'

export function RLPLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()

  return (
    <svg
      className={className}
      preserveAspectRatio="none"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={logoId}
      {...props}
    >
      <title id={logoId}>RLP Logo</title>
      {/* Exported from https://www.figma.com/design/abMCGTqHzUJlRkiy3eNcWz/Resolv-Brand-Kit?node-id=78-1591&t=o0zOdnIr1pqDouNu-0 */}
      <g clipPath="url(#clip0_78_1591)">
        <path
          d="M31.9881 16C31.9881 20.296 30.2955 24.1954 27.5401 27.0697C27.4612 27.152 27.3812 27.2331 27.3012 27.3131C27.2212 27.3931 27.1447 27.4674 27.0658 27.544C26.5024 28.0846 25.9001 28.584 25.2635 29.0377C24.9344 29.2731 24.595 29.496 24.2464 29.7063C21.8361 31.1623 19.0098 32 15.9881 32C12.9664 32 10.1481 31.1646 7.73896 29.7109C7.39038 29.5017 7.04981 29.2789 6.71953 29.0423C6.08296 28.5897 5.48067 28.0914 4.91838 27.552C4.75724 27.3977 4.59953 27.24 4.44524 27.0789C1.6841 24.2046 -0.0119019 20.3006 -0.0119019 16C-0.0119019 11.6994 1.77895 7.58171 4.67495 4.68686C7.56981 1.79086 11.5698 0 15.9881 0C20.4064 0 24.4064 1.79086 27.3012 4.68686C30.1972 7.58171 31.9881 11.5817 31.9881 16Z"
          fill="#F8991D"
          style={{ fill: '#F8991D', fillOpacity: 1 }}
        />
        <g opacity="0.2">
          <path
            d="M4.26651 26.7786C4.00616 27.0389 4.00616 27.4611 4.26651 27.7214C4.52686 27.9818 4.94897 27.9818 5.20932 27.7214L4.26651 26.7786ZM27.9593 4.9714L28.4307 4.5L27.4879 3.55719L27.0165 4.0286L27.9593 4.9714ZM4.73792 27.25L5.20932 27.7214L27.9593 4.9714L27.4879 4.5L27.0165 4.0286L4.26651 26.7786L4.73792 27.25Z"
            fill="#F6E8D7"
            style={{ fill: '#F6E8D7', fillOpacity: 1 }}
          />
          <path
            d="M4.83432 3.9036C4.57397 3.64325 4.15186 3.64325 3.89151 3.9036C3.63116 4.16395 3.63116 4.58605 3.89151 4.8464L4.83432 3.9036ZM27.0608 28.0157L27.5322 28.4871L28.475 27.5443L28.0036 27.0729L27.0608 28.0157ZM4.36292 4.375L3.89151 4.8464L27.0608 28.0157L27.5322 27.5443L28.0036 27.0729L4.83432 3.9036L4.36292 4.375Z"
            fill="#F6E8D7"
            style={{ fill: '#F6E8D7', fillOpacity: 1 }}
          />
          <path
            d="M15.9879 0L15.9879 32"
            stroke="#F6E8D7"
            style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
            strokeWidth="1.33333"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M0.749637 11L20.8746 31.125"
            stroke="#F6E8D7"
            style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
            strokeWidth="1.33333"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M-0.012085 16L31.9879 16"
            stroke="#F6E8D7"
            style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
            strokeWidth="1.33333"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M15.9879 26.25C21.6488 26.25 26.2379 21.6609 26.2379 16C26.2379 10.3391 21.6488 5.75 15.9879 5.75C10.327 5.75 5.73792 10.3391 5.73792 16C5.73792 21.6609 10.327 26.25 15.9879 26.25Z"
            stroke="#F6E8D7"
            style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <path
          d="M26.2379 16C26.2379 10.3391 21.6488 5.75 15.9879 5.75V16L23.2379 23.2457C25.0915 21.391 26.2379 18.8294 26.2379 16Z"
          stroke="#F6E8D7"
          style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.9881 5.75C10.3272 5.75 5.7381 10.3391 5.7381 16H15.9881V5.75Z"
          stroke="#F6E8D7"
          style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.9879 16H5.73792L15.9879 26.25H26.2379L15.9879 16Z"
          stroke="#F6E8D7"
          style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.73792 26.25H15.9879L10.8629 21.125L5.73792 26.25Z"
          stroke="#F6E8D7"
          style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <rect
        x="0.333333"
        y="0.333333"
        width="31.3333"
        height="31.3333"
        rx="15.6667"
        stroke="url(#paint0_linear_78_1591)"
        style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
        strokeWidth="0.666667"
      />
      <defs>
        <linearGradient
          id={`${logoId}-paint0_linear_78_1591`}
          x1="16"
          y1="0"
          x2="16"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor="white"
            stopOpacity="0.3"
            style={{ stopColor: 'white', stopOpacity: 0.3 }}
          />
          <stop offset="1" stopOpacity="0.1" style={{ stopColor: 'black', stopOpacity: 0.1 }} />
        </linearGradient>
        <clipPath id={`${logoId}-clip0_78_1591`}>
          <rect
            width="32"
            height="32"
            rx="16"
            fill="white"
            style={{ fill: 'white', fillOpacity: 1 }}
          />
        </clipPath>
      </defs>
    </svg>
  )
}
