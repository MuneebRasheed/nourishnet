import * as React from 'react'
import Svg, { G, Path, Defs, ClipPath } from 'react-native-svg'

type GoogleIconProps = {
  width?: number
  height?: number
  color?: string
}

function GoogleIcon({ width = 16, height = 16, color, ...props }: GoogleIconProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      {...props}
    >
      <G clipPath="url(#clip0_1_5192)">
        <Path
          d="M15.04 8.167c0-.52-.047-1.02-.133-1.5H8v2.84h3.947a3.381 3.381 0 01-1.474 2.206v1.847h2.38c1.387-1.28 2.187-3.16 2.187-5.393z"
          fill={color ?? '#4285F4'}
        />
        <Path
          d="M8 15.333c1.98 0 3.64-.653 4.853-1.773l-2.38-1.847c-.653.44-1.486.707-2.473.707-1.907 0-3.527-1.287-4.107-3.02h-2.44v1.893A7.326 7.326 0 008 15.333z"
          fill={color ?? '#34A853'}
        />
        <Path
          d="M3.893 9.393A4.394 4.394 0 013.66 8c0-.487.087-.953.233-1.393V4.713h-2.44C.953 5.7.667 6.813.667 8c0 1.187.286 2.3.786 3.287l1.9-1.48.54-.414z"
          fill={color ?? '#FBBC05'}
        />
        <Path
          d="M8 3.587c1.08 0 2.04.373 2.807 1.093l2.1-2.1C11.633 1.393 9.98.667 8 .667a7.32 7.32 0 00-6.547 4.046l2.44 1.894c.58-1.734 2.2-3.02 4.107-3.02z"
          fill={color ?? '#EA4335'}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_1_5192">
          <Path fill="#fff" d="M0 0H15.9998V15.9998H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default GoogleIcon
