import * as React from "react"
import Svg, { Path } from "react-native-svg"

function LeafIcon1(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#008043', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      <Path
        d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"
        stroke={color}
        strokeWidth={1.99998}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
        stroke={color}
        strokeWidth={1.99998}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default LeafIcon1
