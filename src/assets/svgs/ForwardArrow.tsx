import * as React from "react"
import Svg, { Path } from "react-native-svg"

function ForwardArrow(props: { width?: number; height?: number; stroke?: string }) {
  const { width = 20, height = 20, stroke = '#99A1AF', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M7.5 15l5-5-5-5"
        stroke={stroke}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default ForwardArrow
