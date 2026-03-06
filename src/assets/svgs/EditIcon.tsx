import * as React from "react"
import Svg, { Path } from "react-native-svg"

type EditIconProps = {
  width?: number;
  height?: number;
  color?: string;
};

function EditIcon({ width = 20, height = 20, color = '#292D32', ...props }: EditIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <Path
        d="M9.167 1.667H7.5c-4.167 0-5.833 1.666-5.833 5.833v5c0 4.167 1.666 5.833 5.833 5.833h5c4.167 0 5.833-1.666 5.833-5.833v-1.667"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.367 2.517L6.8 9.083c-.25.25-.5.742-.55 1.1l-.358 2.509c-.134.908.508 1.541 1.416 1.416l2.509-.358c.35-.05.841-.3 1.1-.55l6.566-6.567c1.134-1.133 1.667-2.45 0-4.116-1.666-1.667-2.983-1.134-4.116 0zM12.425 3.458a5.954 5.954 0 004.117 4.117"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default EditIcon
