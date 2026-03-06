import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { darkColors, getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import FireStreak from '../assets/svgs/FireStreak';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigations/RootNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const defaultAvatar = require('../assets/images/Avatar.png');

export type HomeHeaderProps = {
  avatarSource?: ImageSourcePropType | null;
  avatarLetter?: string;
  /** When provided (e.g. provider home), show name instead of "Good Morning" */
  userName?: string;
  /** When > 0, show red badge with count on notifications bell */
  notificationCount?: number;
  /** Streak text e.g. "4-day streak" (shown with flame icon) */
  streakText?: string;
};

export default function HomeHeader({
  avatarSource = defaultAvatar,
  avatarLetter = 'U',
  userName,
  notificationCount = 0,
  streakText = '4-day streak',
}: HomeHeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const displayTitle = userName ?? 'Good Morning';
  const showBadge = notificationCount > 0;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <TouchableOpacity activeOpacity={0.8} style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.avatarLetter, { color: palette.white, fontFamily: fontFamilies.poppinsSemiBold }]}>
              {avatarLetter}
            </Text>
          )}
        </TouchableOpacity>
        <View style={styles.greeting}>
          <Text
            style={[
              styles.greetingLabel,
              { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.body },
            ]}
          >
            {displayTitle}
          </Text>
          <View style={styles.locationRow}>
            <FireStreak width={16} height={16} />
            <Text
              style={[
                styles.location,
                { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
              ]}
            >
              {streakText}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.bellWrap, { backgroundColor: colors.inputFieldBg }]}
        onPress={() => navigation.navigate('NotificationsScreen')}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    fontSize: 20,
  },
  greeting: {
    marginLeft: 12,
  },
  greetingLabel: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 2,
    gap: 4,
  },
  location: {},
  bellWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EC221F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: palette.white,
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 11,
  },
});
