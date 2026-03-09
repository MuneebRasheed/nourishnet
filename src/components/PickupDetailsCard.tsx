import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';

export type PickupDetailsCardProps = {
  locationPrimary: string;
  locationSecondary?: string;
  timePrimary: string;
  timeSecondary?: string;
};

export default function PickupDetailsCard({
  locationPrimary,
  locationSecondary,
  timePrimary,
  timeSecondary,
}: PickupDetailsCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const row = (
    icon: React.ReactNode,
    iconBgColor: string,
    label: string,
    primary: string,
    secondary?: string,
    isLast?: boolean
  ) => (
    <View style={[styles.row, !isLast && styles.rowBorder, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBgColor }]}>{icon}</View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
          {label}
        </Text>
        <Text style={[styles.primary, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body }]}>
          {primary}
        </Text>
        {/* {secondary != null && secondary !== '' && (
          <Text style={[styles.secondary, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.body }]}>
            {secondary}
          </Text>
        )} */}
      </View>
    </View>
  );

  const locationIconBg = isDark ? '#3C444B' : palette.roleCardbg;
  const timeIconBg = isDark ? '#4A525C' : palette.timeIconBg;

  return (
    <View style={[styles.card, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}>
      {row(
        <Ionicons name="location-outline" size={20} color={palette.locationIcon} />,
        locationIconBg,
        'Pickup Location',
        locationPrimary,
        locationSecondary,
        false
      )}
      {row(
        <Ionicons name="time-outline" size={20} color={palette.timeIcon} />,
        timeIconBg,
        'Pickup Time',
        timePrimary,
        timeSecondary,
        true
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {

  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {},
  primary: {
    marginTop: 3,
  },
  secondary: {
    marginTop: 5,
  },
});
