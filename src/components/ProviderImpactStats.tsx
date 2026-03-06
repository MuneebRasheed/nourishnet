import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type ProviderImpactStatCardProps = {
  value: string;
  title: string;
  label: string;
  icon: ReactNode;
  iconBgColor: string;
};

export function ProviderImpactStatCard({
  value,
  title,
  label,
  icon,
  iconBgColor,
}: ProviderImpactStatCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const cardBg = isDark ? colors.inputFieldBg : palette.white;
  const borderColor = colors.borderColor;

  return (
    <View style={styles.statCardWrap}>
      <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>
        <Text
          style={[
            styles.statValue,
            {
              color: colors.text,
              fontFamily: fontFamilies.interBold,
              fontSize: fonts.largeTitle,
            },
          ]}
        >
          {value}
        </Text>
        <Text
          style={[
            styles.statTitle,
            {
              color: colors.text,
              fontFamily: fontFamilies.inter,
              fontSize: fonts.subhead,
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.statLabel,
            {
              color: colors.textSecondary,
              fontFamily: fontFamilies.inter,
              fontSize: fonts.caption+2,
            },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export type ProviderImpactStatsRowProps = {
  children: ReactNode;
};

export function ProviderImpactStatsRow({ children }: ProviderImpactStatsRowProps) {
  return <View style={styles.statsRow}>{children}</View>;
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  statCardWrap: {
    flex: 1,
    minWidth: 0,
  },
  statCard: {
    flex: 1,
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    lineHeight: 32,
    textAlign: 'center',
  },
  statTitle: {
    textAlign: 'center',
  },
  statLabel: {
    marginTop: 2,
    textAlign: 'center',
  },
});
