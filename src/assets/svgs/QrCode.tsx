import * as React from "react"
import Svg, { Path } from "react-native-svg"

function QrCode(props:any) {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M1.333 6V4.333c0-1.66 1.34-3 3-3H6M10 1.333h1.667c1.66 0 3 1.34 3 3V6M14.667 10.666v1c0 1.66-1.34 3-3 3h-1M6 14.667H4.333c-1.66 0-3-1.34-3-3V10M7 4.667V6c0 .667-.333 1-1 1H4.667c-.667 0-1-.333-1-1V4.667c0-.667.333-1 1-1H6c.667 0 1 .333 1 1zM12.333 4.667V6c0 .667-.333 1-1 1H10c-.667 0-1-.333-1-1V4.667c0-.667.333-1 1-1h1.333c.667 0 1 .333 1 1zM7 10v1.333c0 .667-.333 1-1 1H4.667c-.667 0-1-.333-1-1V10c0-.667.333-1 1-1H6c.667 0 1 .333 1 1zM12.333 10v1.333c0 .667-.333 1-1 1H10c-.667 0-1-.333-1-1V10c0-.667.333-1 1-1h1.333c.667 0 1 .333 1 1z"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default QrCode
