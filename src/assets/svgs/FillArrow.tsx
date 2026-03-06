import * as React from "react"
import Svg, { Path } from "react-native-svg"

function FillArrow(props: { width?: number; height?: number; color?: string }) {
  const { width = 16, height = 16, color = '#2C2C2C', ...rest } = props
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      {...rest}
    >
      <Path
        d="M10.918 2.447c1.273-.424 2.076-.23 2.473.166.372.373.564 1.104.24 2.243l-.072.234-2.006 6.012v0c-.326.98-.693 1.675-1.057 2.116-.365.442-.683.577-.923.577s-.556-.135-.922-.577c-.364-.44-.73-1.136-1.056-2.116L7 9.316l-.08-.237L6.686 9l-1.788-.594h.001c-.98-.326-1.675-.692-2.116-1.055-.442-.365-.577-.682-.577-.921 0-.24.135-.557.577-.922.44-.364 1.136-.732 2.114-1.06l.001.001 6.021-2v0zm.41 2.053a1.003 1.003 0 00-1.415 0v.001L7.38 7.047a1.003 1.003 0 000 1.413.995.995 0 00.707.293.995.995 0 00.707-.293v-.001l2.533-2.547a1.002 1.002 0 000-1.412z"
        fill={color}
        stroke={color}
      />
    </Svg>
  )
}

export default FillArrow
