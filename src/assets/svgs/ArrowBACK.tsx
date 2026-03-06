import * as React from "react"
import Svg, { Path } from "react-native-svg"

type ArrowBACKProps = {
  width?: number;
  height?: number;
  color?: string;
  [key: string]: unknown;
};

function ArrowBACK({ color = "#2C2C2C", ...props }: ArrowBACKProps) {
  return (
    <Svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      {...props}
    >
      <Path
        d="M13.975 10.942L8.916 16l5.059 5.058"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23.083 16H9.058"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default ArrowBACK
