import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type SettingsHeaderProps = {
  title?: string;
  titleAlign?: 'left' | 'center';
  onLeftPress?: () => void;
  onRightPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showBorder?: boolean;
  /** Horizontal padding for header content (icons + title). Border stays full width when set. */
  contentPaddingHorizontal?: number;
  /** Optional style overrides for the outer header container (including bottom divider). */
  containerStyle?: ViewStyle;
  /** Optional style overrides for the row that holds icons + title. */
  contentStyle?: ViewStyle;
  /** Optional style overrides for the title text. */
  titleStyle?: TextStyle;
  /** Optional style overrides for the left icon button wrapper. */
  leftContainerStyle?: ViewStyle;
  /** Optional style overrides for the right icon button wrapper. */
  rightContainerStyle?: ViewStyle;
};

export default function SettingsHeader({
  title = 'Setting',
  titleAlign = 'center',
  onLeftPress,
  onRightPress,
  leftIcon,
  rightIcon,
  showBorder = true,
  contentPaddingHorizontal,
  containerStyle,
  contentStyle,
  titleStyle,
  leftContainerStyle,
  rightContainerStyle,
}: SettingsHeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const showLeft = onLeftPress != null && leftIcon != null;
  const showRight = onRightPress != null && rightIcon != null;
  const alignTitleLeft = titleAlign === 'left';
  const rowPadding = contentPaddingHorizontal != null ? { paddingHorizontal: contentPaddingHorizontal } : undefined;

  return (
    <View style={[styles.header, containerStyle]}>
      {(showLeft || showRight) ? (
        <View style={[styles.row, rowPadding, contentStyle]}>
          {showLeft ? (
            <Pressable
              onPress={onLeftPress}
              hitSlop={12}
              style={[styles.iconButton, leftContainerStyle]}
            >
              {leftIcon}
            </Pressable>
          ) : alignTitleLeft ? null : (
            <View style={styles.iconPlaceholder} />
          )}
          <Text
            style={[
              styles.headerTitle,
              alignTitleLeft ? styles.headerTitleLeft : styles.headerTitleWithIcons,
              {
                color: colors.text,
                fontFamily: fontFamilies.poppinsBold,
                fontSize: fonts.title,
              },
              titleStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {alignTitleLeft && <View style={styles.spacer} />}
          {showRight ? (
            <Pressable
              onPress={onRightPress}
              hitSlop={12}
              style={[styles.iconButton, rightContainerStyle]}
            >
              {rightIcon}
            </Pressable>
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>
      ) : (
        <View style={[rowPadding, contentStyle]}>
          <Text
            style={[
              styles.headerTitle,
              styles.headerTitleStandalone,
              {
                color: colors.text,
                fontFamily: fontFamilies.poppinsBold,
                fontSize: fonts.title,
              },
              titleStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
      {showBorder && (
        <View style={[styles.headerLine, { backgroundColor: colors.borderColor }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    // paddingHorizontal: 10,
  },
  iconButton: {
    padding: 4,
    minWidth: 32,
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerTitleWithIcons: {
    flex: 1,
    textAlign: 'left',
    marginLeft: 8,
  },
  headerTitleLeft: {
    flex: 0,
    textAlign: 'left',
    marginLeft: 0,
  },
  spacer: {
    flex: 1,
  },
  headerTitleStandalone: {
    flex: undefined,
    textAlign: 'left',
    marginBottom: 12,
    marginLeft: 16,
  },
  headerLine: {
    height: 1,
    width: '100%',
  },
});
