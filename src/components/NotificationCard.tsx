import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type NotificationCardProps = {
  icon: React.ReactNode;
  title: string;
  titleSuffix?: React.ReactNode | string;
  description: string;
  foodTag?: string;
  timeAgo: string;
  unread?: boolean;
};

export default function NotificationCard({
  icon,
  title,
  titleSuffix,
  description,
  foodTag,
  timeAgo,
  unread = false,
}: NotificationCardProps) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: unread ? colors.notificationBg : colors.inputFieldBg },
        !isDark && { borderWidth: 1, borderColor: colors.borderColor },
      ]}
    >
      {unread && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
      <View style={styles.iconRow}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.interMedium,
                  fontSize: fonts.body+2,
                },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {titleSuffix != null && (
              <View style={styles.titleSuffix}>
                {typeof titleSuffix === 'string' ? (
                  <Text style={[styles.titleSuffixText, { color: colors.text }]}>{titleSuffix}</Text>
                ) : (
                  titleSuffix
                )}
              </View>
            )}
          </View>
          <Text
            style={[
              styles.description,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
                lineHeight: 22,
              },
            ]}
            numberOfLines={3}
          >
            {description}
          </Text>
          {foodTag != null && foodTag.length > 0 && (
            <View style={[styles.tag, { backgroundColor: palette.notificationFreshBg }]}>
              <Text
                style={[styles.tagText, { fontFamily: fontFamilies.inter, fontSize: fonts.caption, color: colors.text }]}
                numberOfLines={1}
              >
                {foodTag}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.timeAgo,
              {
                color: colors.text,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.caption ,
              },
            ]}
          >
            {timeAgo}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrap: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  title: {
    flexShrink: 0,
  },
  titleSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSuffixText: {
    fontFamily: fontFamilies.inter,
    fontSize: 14,
  },
  description: {
    lineHeight: 18,
    marginBottom: 8,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 6,
    
  },
  tagText: {
    color: '#fff',
  },
  timeAgo: {
    opacity: 0.9,
  },
});
