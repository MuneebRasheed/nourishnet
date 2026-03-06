import * as React from "react"
import Svg, { Path } from "react-native-svg"

function QuestionMark(props: { width?: number; height?: number; stroke?: string }) {
  const { width = 20, height = 20, stroke = '#4A5565', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M10 18.333a8.333 8.333 0 100-16.666 8.333 8.333 0 000 16.666z"
        stroke={stroke}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.575 7.5a2.5 2.5 0 014.858.833c0 1.667-2.5 2.5-2.5 2.5M10 14.166h.008"
        stroke={stroke}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default QuestionMark
