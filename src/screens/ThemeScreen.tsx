import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore, useResolvedIsDark, type Theme } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { TasksHeader } from '../components/TasksHeader';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Default' },
];

export default function ThemeScreen() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <TasksHeader
        title="Theme"
        isDark={isDark}
        paddingTop={insets.top}
        showBackButton={true}
      />
      <View style={[styles.card, { backgroundColor: colors.inputFieldBg },  { borderWidth: 1, borderColor: colors.borderColor }]}>
        {OPTIONS.map((option, index) => {
          const selected = theme === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setTheme(option.value)}
              style={[
                styles.row,
                index < OPTIONS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
                ]}
              >
                {option.label}
              </Text>
              <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : (isDark ? colors.borderColor : palette.settingsIconBg) }]}>
                {selected ? (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  label: {
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
