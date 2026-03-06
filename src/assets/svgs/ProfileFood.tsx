import * as React from "react"
import Svg, { Path } from "react-native-svg"

type ProfileFoodProps = {
  width?: number
  height?: number
  color?: string
  style?: object
  [key: string]: unknown
}

function ProfileFood({ color, ...props }: ProfileFoodProps) {
  const strokeColor = color ?? "#2C2C2C"
  return (
    <Svg
      width={64}
      height={64}
      viewBox="0 0 64 64"
      fill="none"
      {...props}
    >
      <Path
        d="M5.333 18.666l11.76-11.76a5.332 5.332 0 013.787-1.573h22.24a5.333 5.333 0 013.786 1.574l11.76 11.76M10.667 32v21.333A5.333 5.333 0 0016 58.666h32a5.333 5.333 0 005.333-5.333V32"
        stroke={strokeColor}
        strokeWidth={5.33327}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M40 58.666V48a5.333 5.333 0 00-5.334-5.334h-5.333A5.333 5.333 0 0024 48v10.666M5.333 18.666h53.333M58.666 18.666v8A5.334 5.334 0 0153.333 32a7.2 7.2 0 01-4.24-1.68 1.866 1.866 0 00-2.187 0 7.2 7.2 0 01-4.24 1.68 7.2 7.2 0 01-4.24-1.68 1.866 1.866 0 00-2.187 0A7.2 7.2 0 0132 32a7.2 7.2 0 01-4.24-1.68 1.866 1.866 0 00-2.186 0 7.2 7.2 0 01-4.24 1.68 7.2 7.2 0 01-4.24-1.68 1.866 1.866 0 00-2.187 0 7.2 7.2 0 01-4.24 1.68 5.334 5.334 0 01-5.333-5.334v-8"
        stroke={strokeColor}
        strokeWidth={5.33327}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default ProfileFood
