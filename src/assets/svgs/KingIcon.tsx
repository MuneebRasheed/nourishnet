import * as React from 'react';
import Svg, { Mask, Path, G } from 'react-native-svg';

function KingIcon(props: { width?: number; height?: number; color?: string }) {
  const { width = 20, height = 16, color = '#23A6F7' } = props;
  const idA = React.useId().replace(/:/g, '');
  const idB = `${idA}-b`;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 16" fill="none">
      <Mask
        id={idA}
        style={{ maskType: 'luminance' }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={20}
        height={16}
      >
        <Path d="M0 0h20v16H0V0z" fill="#fff" />
      </Mask>
      <G mask={`url(#${idA})`}>
        <Mask
          id={idB}
          style={{ maskType: 'luminance' }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={20}
          height={16}
        >
          <Path d="M0 0h20v16H0V0z" fill="#fff" />
        </Mask>
        <G mask={`url(#${idB})`}>
          <Path
            d="M16.5 12.8h-13c-.275 0-.5.18-.5.4v.8c0 .22.225.4.5.4h13c.275 0 .5-.18.5-.4v-.8c0-.22-.225-.4-.5-.4zm2-8c-.828 0-1.5.538-1.5 1.2 0 .178.05.343.137.495L14.875 7.58c-.481.23-1.103.1-1.381-.29l-2.547-3.565c.334-.22.553-.55.553-.925 0-.662-.672-1.2-1.5-1.2s-1.5.538-1.5 1.2c0 .375.219.705.553.925L6.506 7.29c-.278.39-.903.52-1.381.29l-2.26-1.085c.085-.15.138-.317.138-.495 0-.662-.672-1.2-1.5-1.2S0 5.338 0 6c0 .663.672 1.2 1.5 1.2.081 0 .163-.01.24-.02L4 12h12l2.26-4.82c.077.01.159.02.24.02.828 0 1.5-.537 1.5-1.2 0-.662-.672-1.2-1.5-1.2z"
            fill={color}
          />
        </G>
      </G>
    </Svg>
  );
}

export default KingIcon;
