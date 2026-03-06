import * as React from "react"
import Svg, { Path } from "react-native-svg"

function PartnerIcon(props: { width?: number; height?: number; stroke?: string }) {
  const { width = 20, height = 20, stroke = '#4A5565', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M15.833 17.5v-1.667A3.333 3.333 0 0012.5 12.5h-5a3.333 3.333 0 00-3.333 3.333V17.5M10 9.167A3.333 3.333 0 1010 2.5a3.333 3.333 0 000 6.667z"
        stroke={stroke}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default PartnerIcon
