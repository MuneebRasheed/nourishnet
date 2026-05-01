import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

type NotificationBannerProps = {
  onEnable: () => void;
};

export default function NotificationBanner({ onEnable }: NotificationBannerProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <View style={[styles.banner, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead }]}>
          Never miss a meal
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
          We'll alert you the moment food is posted
        </Text>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onEnable} activeOpacity={0.8}>
        <Text style={[styles.buttonText, { fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption }]}>
          Enable
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: palette.white,
  },
});
