import * as React from "react"
import Svg, { Path } from "react-native-svg"

function DeleteIcon(props:any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M17.5 4.983a84.752 84.752 0 00-8.35-.416c-1.65 0-3.3.083-4.95.25l-1.7.166M7.083 4.142l.184-1.092c.133-.792.233-1.383 1.641-1.383h2.184c1.408 0 1.516.625 1.641 1.391l.184 1.084M15.708 7.617l-.542 8.391c-.091 1.309-.166 2.325-2.491 2.325h-5.35c-2.325 0-2.4-1.016-2.492-2.325l-.542-8.391M8.608 13.75h2.775M7.917 10.417h4.166"
        stroke="#ED1C1C"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default DeleteIcon
