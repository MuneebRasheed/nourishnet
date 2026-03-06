import * as React from "react"
import Svg, { Path } from "react-native-svg"

export default function CheckMarkHeart(props: { width?: number; height?: number; color?: string }) {
  const { width = 55, height = 55, color = '#757575', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 55 55"
      fill="none"
      {...rest}
    >
      <Path
        d="M49.96 22.917A22.917 22.917 0 1138.959 7.643M20.625 25.208l6.875 6.875L50.417 9.167"
        stroke={color}
        strokeWidth={2.66664}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
