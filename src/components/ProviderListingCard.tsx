import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import BoxIcon from '../assets/svgs/BoxIcon';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';

type ProviderListingCardProps = {
  title: string;
  portionsLabel: string;
  timeRangeLabel: string;
  address: string;
  statusLabel?: string;
  statusColor?: string;
  imageSource?: ImageSourcePropType;
  onPressViewRequests?: () => void;
};

const defaultFoodImage = require('../assets/images/FoodOnboard1.png');

export function ProviderListingCard({
  title,
  portionsLabel,
  timeRangeLabel,
  address,
  statusLabel = 'Active',
  statusColor = palette.roleBulbColor2,
  imageSource,
  onPressViewRequests,
}: ProviderListingCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const cardBg = isDark ? colors.inputFieldBg : palette.white;
  const borderColor = colors.borderColor;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.topRow}>
        <Image
          source={imageSource ?? defaultFoodImage}
          style={styles.image}
        />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.interSemiBold,
                  fontSize: fonts.body + 2,
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusColor ?? colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: palette.white, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BoxIcon width={14} height={14} color={colors.textSecondary} />
              <Text
                style={[
                  styles.metaText,
                  {
                    color: colors.textSecondary,
                    fontFamily: fontFamilies.inter,
                    fontSize: fonts.caption,
                  },
                ]}
              >
                {portionsLabel}
              </Text>
            </View>
            <View style={styles.dot} />
            <View style={styles.metaItem}>
              <ClockICon
                width={14}
                height={14}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.metaText,
                  {
                    color: colors.textSecondary,
                    fontFamily: fontFamilies.inter,
                    fontSize: fonts.caption,
                  },
                ]}
              >
                {timeRangeLabel}
              </Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <LocationPin
              width={14}
              height={14}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.addressText,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.caption,
                },
              ]}
              numberOfLines={2}
            >
              {address}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            borderColor:colors.borderColor,
            backgroundColor:  colors.inputFieldBg 
          },
        ]}
        onPress={onPressViewRequests}
      >
        <Text
          style={[
            styles.buttonLabel,
            {
              color: colors.text,
              fontFamily: fontFamilies.interSemiBold,
              fontSize: fonts.subhead,
            },
          ]}
        >
          View Requests
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    // borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  metaText: {
    flexShrink: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c2c8cf',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    flex: 1,
    minWidth: 0,
  },
  button: {
    marginTop: 20,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {},
});

