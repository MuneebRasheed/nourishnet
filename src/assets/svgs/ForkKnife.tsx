import * as React from "react"
import Svg, { Path } from "react-native-svg"

function ForkKnife(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#975102', ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
    >
      <Path
        d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"
                stroke={color}
        strokeWidth={1.99998}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default ForkKnife
