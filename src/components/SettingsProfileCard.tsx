import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import FireStreak from '../assets/svgs/FireStreak';
import CrownIcon from '../assets/svgs/CrownIcon';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import KingIcon from '../assets/svgs/KingIcon';

const defaultAvatarImage = require('../assets/images/Avatar.png');

export type SettingsProfileCardProps = {
  displayName?: string;
  subtitle?: string;
  subtitle1?: string;
  avatarLetter?: string;
  avatarSource?: ImageSourcePropType | null;
  onEditPress?: () => void;
  /** When true, shows the Premium badge (crown + "Premium") on the card. Use for provider users. */
  showPremium?: boolean;
};

export default function SettingsProfileCard({
  displayName = 'User',
  subtitle = ' 4 days streak',
  avatarLetter = 'A',
  avatarSource = defaultAvatarImage,
  onEditPress,
  showPremium = false,
}: SettingsProfileCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <View style={[styles.card, { backgroundColor: colors.inputFieldBg }]}>
      <View style={[styles.avatar, { backgroundColor: palette.profileAvatarBg }]}>
        {avatarSource ? (
          <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.avatarLetter, { color: palette.white, fontFamily: fontFamilies.interBold, fontSize: fonts.title }]}>
            {avatarLetter.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.name,
              { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body + 2 },
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {showPremium && (
            <View style={styles.premiumBadge}>
              <KingIcon
               width={16} height={12} color={palette.white} />
              <Text style={[styles.premiumText, { fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption + 1 }]}>
                Premium
              </Text>
            </View>
          )}
        </View>
        <View style={styles.subtitleRow}>
          <View style={styles.subtitleLeft}>
            <View style={styles.locationIcon}>
              <FireStreak width={16} height={16}  />
            </View>
            <Text
              style={[
                styles.subtitle,
                { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.caption + 1},
              ]}
            >
              {subtitle}
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={onEditPress} style={styles.editButton}>
            <Text style={[styles.editText, { fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {},
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginBottom: 2,
    gap: 8,
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    marginRight: 4,
  },
  subtitle: {},
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
    backgroundColor: palette.premiumBadge,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginLeft: 16,
  },
  premiumText: {
    color: palette.white,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editText: {
    color: palette.editColor,
  },
});
