import * as React from "react"
import Svg, { Path } from "react-native-svg"

export default function LockIcon(props: { width?: number; height?: number; color?: string }) {
  const { width = 20, height = 20, color = '#2C2C2C', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      {...rest}
    >
      <Path
        d="M5 8.333V6.667c0-2.759.833-5 5-5s5 2.241 5 5v1.666M14.166 18.333H5.833c-3.333 0-4.167-.833-4.167-4.166V12.5c0-3.333.834-4.167 4.167-4.167h8.334c3.333 0 4.166.834 4.166 4.167v1.667c0 3.333-.833 4.166-4.166 4.166z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.33 13.333h.008M9.996 13.333h.008M6.662 13.333h.008"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
