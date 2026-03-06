import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface ArrowDownProps {
  width?: number;
  height?: number;
  color?: string;
}

function ArrowDown({ width = 20, height = 20, color = '#2C2C2C' }: ArrowDownProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
    >
      <Path
        d="M15.592 6.842a.834.834 0 00-1.184 0l-3.816 3.816a.834.834 0 01-1.184 0L5.592 6.842a.834.834 0 10-1.184 1.175l3.825 3.825a2.5 2.5 0 003.534 0l3.825-3.825a.833.833 0 000-1.175z"
        fill={color}
      />
    </Svg>
  );
}

export default ArrowDown
