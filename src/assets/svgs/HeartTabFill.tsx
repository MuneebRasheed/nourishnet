import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function HeartTabFill(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#52976D', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      <G clipPath="url(#clip0_145_1234)">
        <Path
          d="M17.5 1.917a6.4 6.4 0 00-5.5 3.3 6.4 6.4 0 00-5.5-3.3A6.8 6.8 0 000 8.966c0 4.546 4.786 9.513 8.8 12.88a4.974 4.974 0 006.4 0c4.014-3.367 8.8-8.334 8.8-12.88a6.8 6.8 0 00-6.5-7.05z"
          fill={color}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_145_1234">
          <Path fill="#fff" d="M0 0H24V24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default HeartTabFill
