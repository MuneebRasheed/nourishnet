import * as React from "react"
import Svg, { Path } from "react-native-svg"

type PartnerProps = {
  width?: number
  height?: number
  color?: string
  style?: any
}

const DEFAULT_STROKE = '#000000'

function Partner({ width = 64, height = 64, color = DEFAULT_STROKE, style }: PartnerProps) {
  const strokeColor = color ?? DEFAULT_STROKE
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 64 64"
      fill="none"
      style={style}
      color={strokeColor}
    >
      <Path
        d="M50.666 56v-5.334A10.667 10.667 0 0039.999 40H24a10.666 10.666 0 00-10.666 10.666V56M32 29.333c5.89 0 10.666-4.776 10.666-10.666C42.666 12.774 37.891 8 32 8s-10.667 4.775-10.667 10.666S26.109 29.334 32 29.334z"
        stroke={strokeColor}
        strokeWidth={5.33327}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default Partner
