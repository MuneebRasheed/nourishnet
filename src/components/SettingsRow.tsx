import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import ForwardArrow from '../assets/svgs/ForwardArrow';
import { getColors, palette } from '../../utils/colors';
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
};

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
}: SettingsRowProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const textColor = labelColor ?? colors.text;
  const wrapBg = iconBg ?? (isDark ? colors.inputFieldBg : palette.editProfileIconBg);

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: wrapBg }]}>
        {iconComponent ?? (icon != null && <Ionicons name={icon} size={20} color={colors.text} />)}
      </View>
      <Text
        style={[
          styles.label,
          { color: textColor, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
        ]}
      >
        {label}
      </Text>
      {rightElement ?? (showChevron && (
        <ForwardArrow width={20} height={20} stroke={colors.text} />
      ))}
    </>
  );

  const rowStyle = [
    styles.row,
    !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' },
  ];

  if (onPress) {
    return (
      <Pressable    onPress={onPress} style={rowStyle}>
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
