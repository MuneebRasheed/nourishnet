import * as React from "react"
import Svg, { Path } from "react-native-svg"

function PrivacyIcon(props: { width?: number; height?: number; stroke?: string }) {
  const { width = 20, height = 20, stroke = '#4A5565', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M16.667 10.833c0 4.167-2.917 6.25-6.384 7.458a.833.833 0 01-.558-.008c-3.475-1.2-6.391-3.283-6.391-7.45V5a.833.833 0 01.833-.833c1.666 0 3.75-1 5.2-2.267a.975.975 0 011.266 0c1.459 1.275 3.534 2.267 5.2 2.267a.833.833 0 01.834.833v5.833z"
        stroke={stroke}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default PrivacyIcon
