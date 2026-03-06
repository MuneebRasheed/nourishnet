import * as React from "react"
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg"

interface FireStreakProps {
  width?: number;
  height?: number;
  color?: string;
}

function FireStreak({ width = 14, height = 14, color = '#FF6900', ...props }: FireStreakProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill="none"
      {...props}
    >
      <G clipPath="url(#clip0_202_53630)">
        <Path
          d="M4.956 8.455a1.458 1.458 0 001.458-1.458c0-.804-.291-1.166-.583-1.75-.625-1.249-.13-2.363 1.166-3.498.292 1.458 1.166 2.857 2.333 3.79 1.166.933 1.749 2.041 1.749 3.207a4.08 4.08 0 11-8.163 0c0-.672.252-1.337.583-1.749a1.458 1.458 0 001.457 1.458z"
          stroke={color}
          strokeWidth={1.1662}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_202_53630">
          <Path fill="#fff" d="M0 0H13.9944V13.9944H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default FireStreak
