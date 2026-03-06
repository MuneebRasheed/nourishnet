import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LocationPinProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function LocationPin({ width = 20, height = 20, color = '#1DA1F2', ...props }: LocationPinProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M10 10.833a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 18.333c4.167-3.334 6.667-6.392 6.667-9.166a6.667 6.667 0 10-13.334 0c0 2.774 2.5 5.832 6.667 9.166z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
