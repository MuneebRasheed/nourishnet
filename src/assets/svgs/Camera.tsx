import * as React from "react"
import Svg, { Path } from "react-native-svg"

function Camera(props:any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M12.083 3.333H7.916l-2.083 2.5h-2.5A1.667 1.667 0 001.666 7.5V15a1.666 1.666 0 001.667 1.666h13.333A1.666 1.666 0 0018.333 15V7.5a1.667 1.667 0 00-1.667-1.667h-2.5l-2.083-2.5z"
        stroke="#fff"
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 13.333a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        stroke="#fff"
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default Camera
