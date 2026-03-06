import * as React from "react"
import Svg, { Path } from "react-native-svg"

function Ticon(props: any) {
  const { color = '#2C2C2C', width = 20, height = 20, ...rest } = props;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <Path
        d="M2.225 5.975V4.458c0-.958.775-1.725 1.725-1.725h12.1c.958 0 1.725.775 1.725 1.725v1.517M10 17.267V3.425M6.717 17.267h6.567"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default Ticon
