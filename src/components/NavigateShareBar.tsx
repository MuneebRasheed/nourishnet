import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import FillArrow from '../assets/svgs/FillArrow';
import ShareIcon from '../assets/svgs/ShareIcon';

interface NavigateShareBarProps {
  onNavigate?: () => void;
  onShare?: () => void;
  style?: ViewStyle;
}

export default function NavigateShareBar({
  onNavigate,
  onShare,
  style,
}: NavigateShareBarProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <View style={[styles.wrap, style]}>
      <TouchableOpacity
        onPress={onNavigate}
        activeOpacity={0.8}
        style={[styles.navigateBtn, { backgroundColor: colors.inputFieldBg }]}
      >
        <FillArrow width={20} height={20} color={colors.text} />
        <Text
          style={[
            styles.navigateLabel,
            { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
          ]}
        >
          Navigate
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onShare}
        activeOpacity={0.8}
        style={[styles.shareBtn, { backgroundColor: colors.inputFieldBg }]}
      >
        <ShareIcon width={20} height={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
   
  },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  navigateLabel: {},
  shareBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
