import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function SerachBulb(props: { width?: number; height?: number; fill?: string }) {
  const { width = 20, height = 20, fill = '#2C2C2C', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      {...rest}
    >
      <G clipPath="url(#clip0_145_153)">
        <Path
          d="M11.667 20a.833.833 0 01-.5-.167l-3.334-2.5a.832.832 0 01-.333-.666v-4.684L1.653 5.406A3.25 3.25 0 014.083 0h11.834a3.25 3.25 0 012.427 5.407L12.5 11.983v7.184a.833.833 0 01-.833.833zm-2.5-3.75l1.666 1.25v-5.833c0-.204.076-.401.211-.554L17.101 4.3a1.583 1.583 0 00-1.184-2.632H4.083A1.583 1.583 0 002.9 4.298l6.058 6.815c.135.153.21.35.21.554v4.583z"
          fill={fill}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_145_153">
          <Path fill="#fff" d="M0 0H20V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default SerachBulb
