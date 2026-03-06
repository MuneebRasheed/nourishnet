import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface XCircleProps {
  width?: number;
  height?: number;
  color?: string;
}

function XCircle({ width = 20, height = 20, color = '#EC221F', ...props }: XCircleProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M16.667 10a6.667 6.667 0 11-13.334 0 6.667 6.667 0 0113.334 0z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.5 7.5l-5 5M7.5 7.5l5 5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default XCircle;
