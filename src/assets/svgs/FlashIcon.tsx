import * as React from "react"
import Svg, { G, Path, Defs } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: filter */

function FlashIcon(props:any) {
  return (
    <Svg
      width={21}
      height={25}
      viewBox="0 0 21 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G filter="url(#filter0_d_198_12960)">
        <Path
          d="M14.988 10.267h-2.575v-6c0-1.4-.758-1.683-1.683-.633l-.667.758-5.641 6.417c-.775.875-.45 1.592.716 1.592h2.575v6c0 1.4.759 1.683 1.684.633l.666-.758 5.642-6.417c.775-.875.45-1.592-.717-1.592z"
          fill="#fff"
        />
        <Path
          d="M11.743 3.5c-.016-.006.024-.002.075.121.052.126.095.336.095.647v6.5h3.075c.522 0 .625.16.631.172.005.01.06.194-.288.587l-.002.002-5.642 6.416-.666.758c-.205.233-.376.363-.499.424-.12.06-.154.035-.138.041.016.006-.024.002-.075-.121-.052-.126-.096-.335-.096-.647v-6.5H5.139c-.522 0-.625-.16-.631-.173-.005-.01-.061-.193.288-.586v-.001l5.642-6.417.666-.76.002.002c.205-.233.376-.362.498-.423.12-.06.154-.036.14-.042z"
          stroke="#fff"
        />
      </G>
      <Defs></Defs>
    </Svg>
  )
}

export default FlashIcon
