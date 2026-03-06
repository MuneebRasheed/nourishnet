import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import SettingsHeader from '../components/SettingsHeader';
import ImpactCard from '../components/ImpactCard';
import HeartTab from '../assets/svgs/HeartTab';
import LeafIcon1 from '../assets/svgs/LeafIcon1';
import BatchIcon from '../assets/svgs/BatchIcon';
import UpwardArrow from '../assets/svgs/UpwardArrow';
import ArrowCurve from '../assets/svgs/ArrowCurve';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const BAR_DATA = [0.3, 0.5, 0.4, 0.7, 0.85, 1];
const CHART_HEIGHT = 120;

const MILESTONES = [
  {
    id: 'first-rescue',
    title: 'First Rescue',
    description: 'You claimed your first meal!',
    timeAgo: '3 days ago',
  },
  {
    id: 'eco-warrior',
    title: 'Eco Warrior',
    description: 'Saved 10 kg of CO2!',
    timeAgo: '1 week ago',
  },
];

const MILESTONE_PALETTE = [
  { iconBg: palette.roleCardbg, iconColor: palette.roleBulbColor1 },
  { iconBg: palette.roleCard, iconColor: palette.roleBulbColor2 },
];

export default function AnalyticsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();

  const headerTop = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, 16),
    default: insets.top,
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={[styles.header, { marginTop: headerTop }]}>
        <SettingsHeader title="Your Impact" />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
       
          <View style={styles.statsGrid}>
            <ImpactCard
              variant="stat"
              icon={<HeartTab width={20} height={20} color={palette.timeIcon} />}
              title="Meals"
              value="0"
              label="Meals received"
              accentColor={palette.timeIcon}
            />
            <ImpactCard
              variant="stat"
              icon={<LeafIcon1 width={20} height={20} color={palette.roleBulbColor2} />}
              title="Weight"
              value="3"
              label="Pounds rescued"
              accentColor={palette.roleBulbColor2}
            />
            <ImpactCard
              variant="stat"
              icon={<UpwardArrow width={20} height={20} color={palette.logoutColor} />}
              title=" CO2"
              value="0"
              label="Lbs CO2 saved"
              accentColor={palette.logoutColor}
            />
            <ImpactCard
              variant="stat"
              icon={<BatchIcon width={20} height={20} color={palette.roleBulbColor3} />}
              title="Streak"
              value="3"
              label="Day Streak"
              accentColor={palette.roleBulbColor3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
                fontFamily: fontFamilies.poppinsSemiBold,
                fontSize: fonts.subhead,
              },
            ]}
          >
            Monthly Activity
          </Text>
          <View style={[styles.chartCard, { backgroundColor:colors.inputFieldBg,  }]}>
            <View style={styles.barChart}>
              {BAR_DATA.map((ratio, i) => (
                <View key={MONTHS[i]} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(8, CHART_HEIGHT * ratio),
                        backgroundColor: '#FF6B35',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.barLabels}>
              {MONTHS.map((label) => (
                <Text
                  key={label}
                  style={[
                    styles.barLabel,
                    {
                      color: colors.textSecondary,
                      fontFamily: fontFamilies.inter,
                      fontSize: fonts.caption,
                    },
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text,
                fontFamily: fontFamilies.poppinsSemiBold,
                fontSize: fonts.subhead,
              },
            ]}
          >
            Milestones
          </Text>
          {MILESTONES.map((m, index) => {
            const { iconBg, iconColor } = MILESTONE_PALETTE[index];
            const icon =
              index === 0 ? (
                <ArrowCurve width={24} height={24} color={iconColor} />
              ) : (
                <LeafIcon1 width={24} height={24} color={iconColor} />
              );
            return (
              <ImpactCard
                key={m.id}
                variant="milestone"
                icon={icon}
                iconBg={iconBg}
                title={m.title}
                description={m.description}
                timeAgo={m.timeAgo}
              />
            );
          })}
        </View>
      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: 60,
  },
  header: {
    // marginTop set dynamically via insets for responsive safe area on all devices
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop:12
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    minHeight: 8,
    borderRadius: 6,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  barLabel: {},
});
