import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export type ImpactStatCardProps = {
  variant: 'stat';
  icon: ReactNode;
  title: string;
  value: string;
  label: string;
  accentColor: string;
  isDateValue?: boolean; // New prop to indicate if value is a date string
};

export type ImpactMilestoneCardProps = {
  variant: 'milestone';
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  timeAgo: string;
};

export type ImpactCardProps = ImpactStatCardProps | ImpactMilestoneCardProps;

export default function ImpactCard(props: ImpactCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const cardBg = isDark ? colors.surface : palette.white;

  if (props.variant === 'stat') {
    const { icon, title, value, label, accentColor, isDateValue } = props;
    return (
      <View style={[styles.statCard, { backgroundColor:colors.inputFieldBg, borderColor: colors.borderColor }]}>
        <View style={styles.statHeaderRow}>
          {icon}
          <Text style={[styles.statCardTitle, { color: accentColor, fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
            {title}
          </Text>
        </View>
        <Text style={[
          styles.statValue, 
          { 
            color: colors.text, 
            fontFamily: fontFamilies.interBold, 
            fontSize: isDateValue ? fonts.body : fonts.largeTitle 
          }
        ]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
          {label}
        </Text>
      </View>
    );
  }

  const { icon, iconBg, title, description, timeAgo } = props;
  return (
    <View style={[styles.milestoneCard, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor, borderWidth: 1 }]}>
      <View style={[styles.milestoneIconWrap, { backgroundColor: iconBg }]}>
        {icon}  
      </View>
      <Text style={[styles.milestoneTitle, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body+2 }]}>
        {title}
      </Text>
      <Text style={[styles.milestoneDescription, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
        {description}
      </Text>
      <Text style={[styles.milestoneTime, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
        {timeAgo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: '47%',
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 10,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statCardTitle: {
    flex: 1,
    flexShrink: 1,
  },
  statValue: {},
  statLabel: {
    marginTop: 4,
  },
  milestoneCard: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,

  },
  milestoneIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  milestoneTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  milestoneDescription: {
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 16,
  },
  milestoneTime: {
    textAlign: 'center',
    marginTop: 0,
    opacity: 0.8,

  },
});
