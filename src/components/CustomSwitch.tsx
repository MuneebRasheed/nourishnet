import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { palette } from '../../utils/colors';

const TRACK_WIDTH = 40;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 16;
const PADDING = 4;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

export type CustomSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColor?: { false: string; true: string } | string;
  thumbColor?: string;
  trackBorderColor?: string;
};

export default function CustomSwitch({
  value,
  onValueChange,
  trackColor = palette.white,
  thumbColor = palette.largeFontbutton,
  trackBorderColor,
}: CustomSwitchProps) {
  const trackBg =
    typeof trackColor === 'string' ? trackColor : value ? trackColor.true : trackColor.false;
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        { backgroundColor: trackBg },
        trackBorderColor != null && { borderWidth: 1, borderColor: trackBorderColor },
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View
        style={[
          styles.thumb,
          {
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: thumbColor,
            marginLeft: value ? THUMB_TRAVEL : 0,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    alignSelf: 'flex-start',
  },
});
