import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

function ChevronLeft(props: { width?: number; height?: number; color?: string }) {
  const { width = 24, height = 24, color = '#99A1AF', ...rest } = props;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none" {...rest}>
      <Path
        d="M12.5 15l-5-5 5-5"
        stroke={color}
        strokeWidth={1.66665}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default ChevronLeft;
