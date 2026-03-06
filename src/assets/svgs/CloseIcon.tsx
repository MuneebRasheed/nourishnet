import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function CloseIcon(props:any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G filter="url(#filter0_d_198_12965)" clipPath="url(#clip0_198_12965)">
        <Path
          d="M15.246 5.929a.831.831 0 00-1.175-1.175L10 8.824l-4.071-4.07a.83.83 0 00-1.175 1.175l4.07 4.07-4.07 4.072a.83.83 0 001.175 1.175l4.07-4.071 4.072 4.07a.831.831 0 001.175-1.174L11.175 10l4.07-4.071z"
          fill="#fff"
        />
        <Path
          d="M14.424 5.108a.33.33 0 11.468.468l-4.071 4.07-.354.354 4.425 4.424a.33.33 0 11-.468.468L10 10.467l-.354.354-4.07 4.071a.331.331 0 01-.468-.468l4.07-4.071.354-.353-4.424-4.424a.33.33 0 11.468-.468L10 9.532l.353-.354 4.071-4.07z"
          stroke="#fff"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_198_12965">
          <Path fill="#fff" d="M0 0H20V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default CloseIcon
