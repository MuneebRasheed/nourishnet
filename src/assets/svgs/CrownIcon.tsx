import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function CrownIcon(props: { width?: number; height?: number; color?: string }) {
  const { width = 16, height = 16, color = '#ffffff', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...rest}>
      <Path
        d="M2 12L3.5 6L6 9L8 4L10 9L12.5 6L14 12H2Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 12H14"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
