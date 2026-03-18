import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import ForwardArrow from '../assets/svgs/ForwardArrow';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type SettingsRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  iconComponent?: React.ReactNode;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  rightElement?: React.ReactNode;
  labelColor?: string;
  iconBg?: string;
  backgroundColor?: string;
};

const ICON_BG_DARK = '#FFFFFF1A';
const ICON_BG_LIGHT = '#0C0C0D08';
const BORDER_DARK = 'rgba(255,255,255,0.12)';
const BORDER_LIGHT = 'rgba(0,0,0,0.1)';
const RIPPLE_DARK = 'rgba(255,255,255,0.08)';
const RIPPLE_LIGHT = 'rgba(0,0,0,0.06)';
const DEFAULT_ROW_BG = '#2E3842';

export default function SettingsRow({
  icon,
  iconComponent,
  label,
  onPress,
  showChevron = true,
  isLast = false,
  rightElement,
  labelColor,
  iconBg,
  backgroundColor,
}: SettingsRowProps) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const bg = backgroundColor ?? DEFAULT_ROW_BG;
  const iconBackground = iconBg ?? (isDark ? ICON_BG_DARK : ICON_BG_LIGHT);
  const labelColorResolved = labelColor ?? colors.text;
  const borderColor = isDark ? BORDER_DARK : BORDER_LIGHT;

  const rowStyle = [
    styles.row,
    { backgroundColor: bg },
    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
  ];

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        {iconComponent ?? (icon != null && <Ionicons name={icon} size={20} color={colors.text} />)}
      </View>
      <Text style={[styles.label, { color: labelColorResolved, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body }]}>
        {label}
      </Text>
      {rightElement ?? (showChevron && <ForwardArrow width={20} height={20} stroke={colors.text} />)}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={rowStyle}
        android_ripple={Platform.OS === 'android' ? { color: isDark ? RIPPLE_DARK : RIPPLE_LIGHT } : undefined}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  label: {
    flex: 1,
  },
});
