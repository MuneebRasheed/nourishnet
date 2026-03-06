import * as React from "react"
import Svg, { Path } from "react-native-svg"

function ArrowCurve(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#975102', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      <Path
        d="M22 7l-8.5 8.5-5-5L2 17"
        stroke={color}
        strokeWidth={1.99998}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 7h6v6"
        stroke={color}
        strokeWidth={1.99998}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default ArrowCurve
