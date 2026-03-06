import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

function HeartTab(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#52976D', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <G clipPath="url(#clip0_145_61)">
        <Path
          d="M17.5 1.917a6.4 6.4 0 00-5.5 3.3 6.4 6.4 0 00-5.5-3.3A6.8 6.8 0 000 8.966c0 4.546 4.786 9.513 8.8 12.88a4.974 4.974 0 006.4 0c4.014-3.367 8.8-8.334 8.8-12.88a6.8 6.8 0 00-6.5-7.05zm-3.585 18.4a2.973 2.973 0 01-3.83 0C4.947 16.006 2 11.87 2 8.967a4.8 4.8 0 014.5-5.05 4.8 4.8 0 014.5 5.05 1 1 0 102 0 4.8 4.8 0 014.5-5.05 4.8 4.8 0 014.5 5.05c0 2.902-2.947 7.039-8.085 11.345v.005z"
          fill={color}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_145_61">
          <Path fill="#fff" d="M0 0H24V24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default HeartTab
