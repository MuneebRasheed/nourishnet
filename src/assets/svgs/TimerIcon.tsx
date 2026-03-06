import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface TimerIconProps {
  width?: number;
  height?: number;
  color?: string;
}

function TimerIcon({ width = 16, height = 16, color = "#757575", ...props }: TimerIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <Path
        d="M13.833 8.833A5.835 5.835 0 018 14.667a5.836 5.836 0 01-5.833-5.834A5.835 5.835 0 018 3a5.835 5.835 0 015.833 5.833zM8 5.333v3.334"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 1.333h4"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default TimerIcon
    