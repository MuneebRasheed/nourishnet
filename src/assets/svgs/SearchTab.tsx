import * as React from "react"
import Svg, { Path } from "react-native-svg"

function SearchTab(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#52976D', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M11.5 21a9.5 9.5 0 100-19 9.5 9.5 0 000 19zM22 22l-2-2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default SearchTab
