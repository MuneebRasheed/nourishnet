import * as React from "react"
import Svg, { Path } from "react-native-svg"

const DEFAULT_SIZE = 26;

type BoxIconProps = {
  width?: number;
  height?: number;
  color?: string;
};

function BoxIcon({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = "#975102" }: BoxIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 26 27"
      fill="none"
    >
      <Path
        d="M11.917 24.446a2.105 2.105 0 002.166 0l7.584-4.5a2.21 2.21 0 00.792-.822c.19-.342.29-.73.291-1.124V9c0-.395-.1-.782-.29-1.124a2.21 2.21 0 00-.793-.822l-7.584-4.5a2.105 2.105 0 00-2.166 0l-7.584 4.5a2.21 2.21 0 00-.792.822c-.19.342-.29.73-.291 1.124v9c0 .395.1.782.29 1.124.191.341.464.625.793.822l7.584 4.5zM13 24.75V13.5"
        stroke={color}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.564 7.875L13 13.5l9.436-5.625M8.125 4.804l9.75 5.793"
        stroke={color}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default BoxIcon
