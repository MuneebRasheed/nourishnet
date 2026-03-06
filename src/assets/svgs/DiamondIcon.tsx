import * as React from "react"
import Svg, { Mask, Path, G } from "react-native-svg"

export default function DiamondIcon(props: { width?: number; height?: number; color?: string }) {
  const { width = 20, height = 18, color = '#9061F9' } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 18" fill="none">
      <Mask
        id="a"
        style={{
          maskType: "luminance"
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={20}
        height={18}
      >
        <Path d="M0 0h20v17.778H0V0z" fill="#fff" />
      </Mask>
      <G mask="url(#a)">
        <Mask
          id="b"
          style={{
            maskType: "luminance"
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={20}
          height={18}
        >
          <Path d="M0 0h20v17.778H0V0z" fill="#fff" />
        </Mask>
        <G mask="url(#b)">
          <Path
            d="M16.858.988L20 5.926h-3.51L14.087.988h2.77zm-4.445 0l2.403 4.938H5.184L7.587.988h4.826zm-9.27 0h2.77L3.51 5.926H0L3.142.988zM0 6.914h3.497l4.27 7.768c.052.096-.093.182-.173.102L0 6.914zm5.146 0h9.708l-4.757 9.82c-.034.075-.156.075-.19 0l-4.761-9.82zm7.087 7.768l4.27-7.768H20l-7.594 7.867c-.08.083-.225-.003-.173-.099z"
            fill={color}
          />
        </G>
      </G>
    </Svg>
  )
}
