import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

const DEFAULT_PREFERENCES = ['Prepared Meals', 'Groceries', 'Baby Items', 'Halal'];

export type PreferenceChipsProps = {
  options?: string[];
  selected?: string[];
  maxSelections?: number;
  onSelectionChange?: (selected: string[]) => void;
};

export default function PreferenceChips({
  options = DEFAULT_PREFERENCES,
  selected = [],
  maxSelections = 2,
  onSelectionChange,
}: PreferenceChipsProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((s) => s !== option)
      : selected.length < maxSelections
        ? [...selected, option]
        : selected;
    onSelectionChange?.(next);
  };

  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              active && { backgroundColor: colors.primary },
              !active && {
                backgroundColor: colors.inputFieldBg,
                
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: active ? palette.white : colors.text,
                  fontFamily: fontFamilies.interSemiBold,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {},
});
