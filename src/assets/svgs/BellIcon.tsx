import * as React from "react"
import Svg, { Path } from "react-native-svg"

function BellIcon(props: { width?: number; height?: number; stroke?: string }) {
  const { width = 20, height = 20, stroke = '#4A5565', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M8.557 17.5a1.666 1.666 0 002.886 0M2.718 12.772a.833.833 0 00.615 1.395h13.333a.833.833 0 00.617-1.394C16.175 11.63 15 10.416 15 6.667a5 5 0 10-10 0c0 3.749-1.176 4.963-2.282 6.105z"
        stroke={stroke}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default BellIcon
