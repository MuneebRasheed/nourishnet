import * as React from "react"
import Svg, { Path } from "react-native-svg"

const DEFAULT_STROKE = '#975102'

function RoleBulb(props: any) {
  const stroke = props.color ?? props.stroke ?? DEFAULT_STROKE
  const { color, ...rest } = props
  return (
    <Svg
      width={40}
      height={40}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <Path
        d="M28.333 35A1.667 1.667 0 0030 33.333v-8.917c0-.761.526-1.406 1.211-1.735a6.667 6.667 0 00-3.556-12.648 8.333 8.333 0 00-15.31 0A6.666 6.666 0 008.788 22.68c.685.33 1.212.975 1.212 1.735v8.918A1.667 1.667 0 0011.667 35h16.666zM10 28.333h20"
        stroke={stroke}
        strokeWidth={3.3333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default RoleBulb
