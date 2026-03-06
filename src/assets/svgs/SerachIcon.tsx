import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function SearchIcon(props:any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G clipPath="url(#clip0_183_7586)">
        <Path
          d="M17.233.973l-.017-.006-2.263-.75A4.18 4.18 0 0012.537.15L7.89 1.501a2.52 2.52 0 01-1.707-.15l-.416-.194A4.167 4.167 0 000 5v10.063a4.178 4.178 0 003 4l2.39.75A4.16 4.16 0 006.638 20c.376.005.751-.046 1.113-.15l4.833-1.334a2.5 2.5 0 011.348.01l1.952.564A3.334 3.334 0 0020 15.851V4.897A4.175 4.175 0 0017.233.973zM3.48 17.466a2.51 2.51 0 01-1.813-2.403V5A2.46 2.46 0 012.78 2.917 2.5 2.5 0 014.167 2.5c.318 0 .633.063.926.185 0 0 .621.266.74.309v15.208l-2.353-.736zm4.02.723V3.233c.283-.015.564-.059.838-.13L12.5 1.895v14.94l-5 1.355zm10.833-2.338a1.667 1.667 0 01-2.027 1.628l-2.14-.602V1.729l2.516.816a2.505 2.505 0 011.651 2.352V15.85z"
          fill="#2C2C2C"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_183_7586">
          <Path fill="#fff" d="M0 0H20V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default SearchIcon
