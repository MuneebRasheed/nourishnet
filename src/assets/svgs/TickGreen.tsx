import * as React from "react"
import Svg, { Path, G, Defs, ClipPath } from "react-native-svg"

function TickGreen(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12z"
        fill="#52976D"
      />
      <G
        clipPath="url(#clip0_86_14101)"
        stroke="#fff"
        strokeWidth={1.33332}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M12 18.667a6.667 6.667 0 100-13.334 6.667 6.667 0 000 13.334z" />
        <Path d="M10 12l1.333 1.333L14 10.667" />
      </G>
      <Defs>
        <ClipPath id="clip0_86_14101">
          <Path
            fill="#fff"
            transform="translate(4 4)"
            d="M0 0H15.9998V15.9998H0z"
          />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default TickGreen
