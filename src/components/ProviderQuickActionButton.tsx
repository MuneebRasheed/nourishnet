import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type ProviderQuickActionButtonProps = {
  /** Optional first line (smaller, regular weight) e.g. "View All", "Track" */
  title?: string;
  /** Main line (larger, semibold) e.g. "My Listings", "Impact" */
  label: string;
  icon: ReactNode;
  /** Background color for the circular icon wrapper */
  iconBgColor?: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function ProviderQuickActionButton({
  title,
  label,
  icon,
  iconBgColor,
  onPress,
  style,
}: ProviderQuickActionButtonProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: colors.inputFieldBg,
          borderColor: colors.borderColor,
        },
        style,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: iconBgColor ?? colors.inputFieldBg },
        ]}
      >
        {icon}
      </View>
      <View style={styles.textWrap}>
        {title ? (
          <Text
            style={[
              styles.titleLine,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.caption,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
        <Text
          style={[
            styles.labelLine,
            {
              color: colors.text,
              fontFamily: fontFamilies.interSemiBold,
              fontSize: fonts.body,
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export type ProviderQuickActionsRowProps = {
  children: ReactNode;
};

export function ProviderQuickActionsRow({ children }: ProviderQuickActionsRowProps) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  titleLine: {},
  labelLine: {},
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
