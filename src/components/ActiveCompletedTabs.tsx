import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type ActiveCompletedTab = 'Active' | 'Completed';

type ActiveCompletedTabsProps = {
  value: ActiveCompletedTab | string;
  onChange: (tab: ActiveCompletedTab | string) => void;
  style?: object;
  /** Custom tab labels, e.g. ['Request', 'Available'] */
  options?: readonly [string, string];
};

const DEFAULT_OPTIONS: readonly [string, string] = ['Active', 'Completed'];

export function ActiveCompletedTabs({ value, onChange, style, options = DEFAULT_OPTIONS }: ActiveCompletedTabsProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const tabs = options;

  return (
    <View style={[styles.tabs, { backgroundColor: colors.inputFieldBg }, style]}>
      {tabs.map((tab) => {
        const active = tab === value;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onChange(tab)}
            style={[
              styles.tab,
              { backgroundColor: active ? colors.primary : 'transparent' },
            ]}
            activeOpacity={0.9}
          >
            <Text
              style={{
                color: active ? palette.white : colors.textSecondary,
                fontFamily: fontFamilies.interBold,
                fontSize: fonts.body,
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    flex: 1,
    borderRadius: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});
