import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface ClockIConProps {
  color?: string
  width?: number
  height?: number
}

export default function ClockICon({ color = "#2C2C2C", width = 20, height = 20, ...props }: ClockIConProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <Path
        d="M18.333 10c0 4.6-3.733 8.333-8.333 8.333A8.336 8.336 0 011.667 10C1.667 5.4 5.4 1.667 10 1.667S18.333 5.4 18.333 10z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.092 12.65l-2.584-1.542c-.45-.266-.816-.908-.816-1.433V6.258"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
