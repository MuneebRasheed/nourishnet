import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function ShareIcon(props: { width?: number; height?: number; color?: string }) {
  const { width = 16, height = 16, color = '#2C2C2C', ...rest } = props
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      {...rest}
    >
      <G clipPath="url(#clip0_183_7097)">
        <Path
          d="M11.386.962a2.604 2.604 0 11-.661 3.622l-.238-.344-.38.173L5.78 6.38l-.438.2.183.445c.256.622.255 1.32-.003 1.941l-.185.447.441.2 4.334 1.957.38.171.236-.343a2.619 2.619 0 11-.461 1.484c.002-.148.017-.295.044-.44l.07-.385-.356-.161-4.613-2.083-.303-.137-.243.227A2.597 2.597 0 01.5 7.993v-.004a2.598 2.598 0 014.375-1.903l.243.23.305-.139 4.601-2.09.357-.163-.072-.386a2.584 2.584 0 01-.033-.217l-.012-.221A2.603 2.603 0 0111.386.962z"
          fill={color}
          stroke={color}
          strokeWidth={0.998773}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_183_7097">
          <Path fill="#fff" d="M0 0H16V16H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default ShareIcon
