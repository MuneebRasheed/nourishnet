import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

interface ConfirmationCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export default function ConfirmationCheckbox({ label, checked, onToggle }: ConfirmationCheckboxProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.circle,
          {
            borderColor: colors.borderColor,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {checked && <View style={[styles.fill, { backgroundColor: palette.white }]} />}
      </View>
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontFamily: fontFamilies.inter,
            fontSize: fonts.subhead,
            lineHeight: fonts.subhead * 1.4,
          },
        ]}
        numberOfLines={4}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    flex: 1,
  },
});
