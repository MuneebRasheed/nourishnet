
import * as React from 'react'
import Svg, { G, Path, Defs, ClipPath } from 'react-native-svg'
/* SVGR has dropped some elements not supported by react-native-svg: filter */

type AppleIconProps = {
  width?: number
  height?: number
  color?: string
}

function AppleIcon({ width = 16, height = 16, color = '#fff', ...props }: AppleIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <G filter="url(#filter0_d_129_96)" clipPath="url(#clip0_129_96)">
        <Path
          d="M12.481 8.455c-.007-1.311.581-2.3 1.771-3.03-.666-.96-1.672-1.489-3-1.592-1.258-.1-2.632.74-3.135.74-.531 0-1.75-.705-2.706-.705-1.977.033-4.078 1.59-4.078 4.758 0 .936.17 1.903.51 2.901.454 1.31 2.09 4.526 3.798 4.472.892-.021 1.523-.64 2.685-.64 1.126 0 1.71.64 2.706.64 1.722-.025 3.203-2.947 3.635-4.261-2.31-1.097-2.186-3.215-2.186-3.283zM10.476 2.59c.967-1.158.879-2.211.85-2.59-.854.05-1.842.586-2.405 1.247-.62.707-.985 1.582-.907 2.568.925.071 1.768-.407 2.462-1.225z"
          fill={color}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_129_96">
          <Path fill="#fff" d="M0 0H16V16H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default AppleIcon
