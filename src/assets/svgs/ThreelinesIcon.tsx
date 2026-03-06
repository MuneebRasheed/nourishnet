import * as React from "react"
import Svg, { Path } from "react-native-svg"

const DEFAULT_SIZE = 20;

type ThreelinesIconProps = {
  width?: number;
  height?: number;
  color?: string;
};

function ThreelinesIcon({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = "#00A63E" }: ThreelinesIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
    >
      <Path
        d="M2.5 2.5v13.333A1.667 1.667 0 004.167 17.5H17.5M15 14.166V7.5M10.833 14.166v-10M6.667 14.166v-2.5"
        stroke={color}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default ThreelinesIcon
