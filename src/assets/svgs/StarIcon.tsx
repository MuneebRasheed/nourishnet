import * as React from "react"
import Svg, { Mask, Path, G } from "react-native-svg"

export default function StarIcon(props: { width?: number; height?: number; color?: string }) {
  const { width = 20, height = 18, color = 'gold' } = props;
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
        <Path
          d="M9.004 1.537L6.736 5.623l-5.073.658C.753 6.398.39 7.395 1.05 7.966l3.67 3.179-.868 4.49c-.156.812.805 1.42 1.61 1.04l4.54-2.12 4.537 2.12c.806.377 1.768-.228 1.611-1.04l-.868-4.49 3.67-3.18c.66-.57.296-1.567-.614-1.684l-5.073-.658-2.267-4.086c-.407-.729-1.584-.738-1.993 0z"
          fill={color}
        />
      </G>
    </Svg>
  )
}
