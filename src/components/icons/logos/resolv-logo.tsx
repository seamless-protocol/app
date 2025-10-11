import type { SVGProps } from 'react'
import { useId } from 'react'

export function ResolvLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const logoId = useId()

  return (
    <svg
      className={className}
      preserveAspectRatio="none"
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={logoId}
      {...props}
    >
      <title id={logoId}>RLP Logo</title>
      {/* Exported from https://www.figma.com/design/abMCGTqHzUJlRkiy3eNcWz/Resolv-Brand-Kit?node-id=78-1591&t=o0zOdnIr1pqDouNu-0 */}
      <g clip-path="url(#clip0_133_1144)">
        <path
          d="M299.889 150C299.889 190.275 284.021 226.832 258.189 253.779C257.45 254.55 256.7 255.311 255.95 256.061C255.2 256.811 254.482 257.507 253.743 258.225C248.46 263.293 242.814 267.975 236.846 272.229C233.76 274.436 230.578 276.525 227.31 278.496C204.714 292.146 178.218 300 149.889 300C121.56 300 95.139 292.168 72.5533 278.539C69.2854 276.579 66.0926 274.489 62.9961 272.271C57.0283 268.029 51.3818 263.357 46.1104 258.3C44.5997 256.854 43.1211 255.375 41.6747 253.864C15.789 226.918 -0.111023 190.318 -0.111023 150C-0.111023 109.682 16.6783 71.0786 43.8283 43.9393C70.9675 16.7893 108.468 0 149.889 0C191.31 0 228.81 16.7893 255.95 43.9393C283.1 71.0786 299.889 108.579 299.889 150Z"
          fill="#FDEFDF"
          style={{ fill: '#FDEFDF', fillOpacity: 1 }}
        />
        <g filter="url(#filter0_n_133_1144)">
          <path
            d="M141.58 248.047L57.8295 164.162C54.8802 161.208 56.9724 156.163 61.1467 156.163H139.875C143.605 156.163 147.182 157.645 149.82 160.283L233.689 244.172C236.641 247.125 234.55 252.174 230.374 252.174H151.532C147.799 252.174 144.218 250.689 141.58 248.047Z"
            fill="#FF0000"
            style={{ fill: '#FF0000', fillOpacity: 1 }}
          />
          <path
            d="M141.58 248.047L57.8295 164.162C54.8802 161.208 56.9724 156.163 61.1467 156.163H139.875C143.605 156.163 147.182 157.645 149.82 160.283L233.689 244.172C236.641 247.125 234.55 252.174 230.374 252.174H151.532C147.799 252.174 144.218 250.689 141.58 248.047Z"
            fill="#716B63"
            style={{ fill: '#716B63', fillOpacity: 1 }}
          />
        </g>
        <g filter="url(#filter1_n_133_1144)">
          <path
            d="M131.859 143.657H51.469C48.7858 143.657 46.6396 141.407 46.9067 138.737C47.0955 136.85 47.3362 134.979 47.6274 133.124C54.4114 89.9014 88.585 55.7495 131.859 48.9285C133.718 48.6355 135.594 48.3929 137.485 48.2022C140.156 47.9328 142.409 50.0796 142.409 52.7645V138.969C142.409 141.558 140.31 143.657 137.721 143.657H131.859Z"
            fill="#E04545"
            style={{ fill: '#E04545', fillOpacity: 1 }}
          />
          <path
            d="M131.859 143.657H51.469C48.7858 143.657 46.6396 141.407 46.9067 138.737C47.0955 136.85 47.3362 134.979 47.6274 133.124C54.4114 89.9014 88.585 55.7495 131.859 48.9285C133.718 48.6355 135.594 48.3929 137.485 48.2022C140.156 47.9328 142.409 50.0796 142.409 52.7645V138.969C142.409 141.558 140.31 143.657 137.721 143.657H131.859Z"
            fill="#45413C"
            style={{ fill: '#45413C', fillOpacity: 1 }}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M137.721 143.657C140.31 143.657 142.409 141.558 142.409 138.969V52.7645C142.409 50.0796 140.156 47.9328 137.485 48.2022C135.594 48.3929 133.718 48.6355 131.859 48.9285V143.657H137.721Z"
            fill="#E04545"
            style={{ fill: '#E04545', fillOpacity: 1 }}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M137.721 143.657C140.31 143.657 142.409 141.558 142.409 138.969V52.7645C142.409 50.0796 140.156 47.9328 137.485 48.2022C135.594 48.3929 133.718 48.6355 131.859 48.9285V143.657H137.721Z"
            fill="#45413C"
            style={{ fill: '#45413C', fillOpacity: 1 }}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M131.859 143.657V137.811C131.859 135.222 129.76 133.124 127.171 133.124H47.6274C47.3362 134.979 47.0955 136.85 46.9067 138.737C46.6396 141.407 48.7858 143.657 51.469 143.657H131.859Z"
            fill="#E04545"
            style={{ fill: '#E04545', fillOpacity: 1 }}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M131.859 143.657V137.811C131.859 135.222 129.76 133.124 127.171 133.124H47.6274C47.3362 134.979 47.0955 136.85 46.9067 138.737C46.6396 141.407 48.7858 143.657 51.469 143.657H131.859Z"
            fill="#45413C"
            style={{ fill: '#45413C', fillOpacity: 1 }}
          />
        </g>
        <g filter="url(#filter2_n_133_1144)">
          <path
            d="M179.014 51.8717V171.964L159.062 152.244C156.389 149.602 154.884 146 154.884 142.242V52.7515C154.884 50.0714 157.129 47.9268 159.797 48.1839C166.404 48.8208 172.829 50.0694 179.014 51.8717Z"
            fill="#5127E9"
            style={{ fill: '#5127E9', fillOpacity: 1 }}
          />
          <path
            d="M179.014 51.8717V171.964L159.062 152.244C156.389 149.602 154.884 146 154.884 142.242V52.7515C154.884 50.0714 157.129 47.9268 159.797 48.1839C166.404 48.8208 172.829 50.0694 179.014 51.8717Z"
            fill="#45413C"
            style={{ fill: '#45413C', fillOpacity: 1 }}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M179.014 171.964V51.8717C222.053 64.4123 253.465 103.76 253.465 150.359C253.465 175.063 244.637 197.728 229.928 215.443C228.228 217.49 225.151 217.563 223.258 215.692L179.014 171.964Z"
            fill="#5127E9"
            style={{ fill: '#5127E9', fillOpacity: 1 }}
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M179.014 171.964V51.8717C222.053 64.4123 253.465 103.76 253.465 150.359C253.465 175.063 244.637 197.728 229.928 215.443C228.228 217.49 225.151 217.563 223.258 215.692L179.014 171.964Z"
            fill="#45413C"
            style={{ fill: '#45413C', fillOpacity: 1 }}
          />
        </g>
        <g filter="url(#filter3_n_133_1144)">
          <path
            d="M63.3942 244.173L88.078 219.456C89.8745 217.658 92.7775 217.619 94.6216 219.369L120.666 244.086C123.739 247.001 121.675 252.173 117.44 252.173H66.711C62.5364 252.173 60.4443 247.127 63.3942 244.173Z"
            fill="#D9D9D9"
            style={{ fill: '#D9D9D9', fillOpacity: 1 }}
          />
          <path
            d="M63.3942 244.173L88.078 219.456C89.8745 217.658 92.7775 217.619 94.6216 219.369L120.666 244.086C123.739 247.001 121.675 252.173 117.44 252.173H66.711C62.5364 252.173 60.4443 247.127 63.3942 244.173Z"
            fill="#45413C"
            style={{ fill: '#45413C', fillOpacity: 1 }}
          />
        </g>
      </g>
      <rect
        x="3.125"
        y="3.125"
        width="293.75"
        height="293.75"
        rx="146.875"
        stroke="url(#paint0_linear_133_1144)"
        style={{ stroke: '#F6E8D7', strokeOpacity: 1 }}
        strokeWidth="6.25"
      />
      <defs>
        <filter
          id={`${logoId}-filter0_n_133_1144`}
          x="56.4498"
          y="156.163"
          width="178.621"
          height="96.011"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2929292917251587 1.2929292917251587"
            stitchTiles="stitch"
            numOctaves="3"
            result="noise"
            seed="8417"
          />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood floodColor="#716B63" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood flood-color="#FDEFDF" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_133_1144">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <filter
          id={`${logoId}-filter1_n_133_1144`}
          x="46.8842"
          y="48.1793"
          width="95.5245"
          height="95.4776"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2929292917251587 1.2929292917251587"
            stitchTiles="stitch"
            numOctaves="3"
            result="noise"
            seed="8417"
          />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood floodColor="#716B63" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood flood-color="#FDEFDF" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_133_1144">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <filter
          id={`${logoId}-filter2_n_133_1144`}
          x="154.884"
          y="48.163"
          width="98.5806"
          height="168.876"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2929292917251587 1.2929292917251587"
            stitchTiles="stitch"
            numOctaves="3"
            result="noise"
            seed="8417"
          />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood flood-color="#716B63" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood flood-color="#FDEFDF" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_133_1144">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <filter
          id={`${logoId}-filter3_n_133_1144`}
          x="62.0141"
          y="218.081"
          width="60.1223"
          height="34.0919"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2929292917251587 1.2929292917251587"
            stitchTiles="stitch"
            numOctaves="3"
            result="noise"
            seed="8417"
          />
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
          <feComponentTransfer in="alphaNoise" result="coloredNoise2">
            <feFuncA
              type="discrete"
              tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
            />
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise2" result="noise2Clipped" />
          <feFlood flood-color="#716B63" result="color1Flood" />
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
          <feFlood flood-color="#FDEFDF" result="color2Flood" />
          <feComposite operator="in" in2="noise2Clipped" in="color2Flood" result="color2" />
          <feMerge result="effect1_noise_133_1144">
            <feMergeNode in="shape" />
            <feMergeNode in="color1" />
            <feMergeNode in="color2" />
          </feMerge>
        </filter>
        <linearGradient
          id={`${logoId}-paint0_linear_133_1144`}
          x1="150"
          y1="0"
          x2="150"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            stopColor="white"
            stopOpacity="0.3"
            style={{ stopColor: 'white', stopOpacity: 0.3 }}
          />
          <stop offset="1" stopOpacity="0.1" style={{ stopColor: 'black', stopOpacity: 0.1 }} />
        </linearGradient>
        <clipPath id={`${logoId}-clip0_133_1144`}>
          <rect
            width="300"
            height="300"
            rx="150"
            fill="white"
            style={{ fill: 'white', fillOpacity: 1 }}
          />
        </clipPath>
      </defs>
    </svg>
  )
}
