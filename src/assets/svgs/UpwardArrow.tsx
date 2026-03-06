import * as React from "react"
import Svg, { Path } from "react-native-svg"

function UpwardArrow(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#EC221F', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      <Path
        d="M17.71 9.88l-4.3-4.29a2 2 0 00-2.82 0l-4.3 4.29a1 1 0 101.42 1.41L11 8v11a1 1 0 002 0V8l3.29 3.29a1 1 0 001.42-1.41z"
        fill={color}
      />
    </Svg>
  )
}

export default UpwardArrow
