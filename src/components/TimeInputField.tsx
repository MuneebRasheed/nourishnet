import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import ClockICon from '../assets/svgs/ClockICon';

type TimeInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
};

export default function TimeInputField({
  label,
  value,
  onChangeText,
  placeholder = '4:40',
  icon,
}: TimeInputFieldProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <View style={styles.timeField}>
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontFamily: fontFamilies.interMedium,
            fontSize: fonts.subhead,
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.timeInputRow,
          {
            backgroundColor: colors.inputFieldBg,
            borderColor: colors.borderColor,
          },
        ]}
      >
        {icon ?? <ClockICon width={20} height={20} color={colors.textSecondary} />}
        <TextInput
          style={[styles.timeInput, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeField: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  timeInput: {
    flex: 1,
    fontFamily: fontFamilies.inter,
    fontSize: 14,
    padding: 0,
  },
});
