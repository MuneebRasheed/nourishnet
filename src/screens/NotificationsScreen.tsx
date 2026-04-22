import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResolvedIsDark } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import NotificationCard from '../components/NotificationCard';
import ChevronLeft from '../assets/svgs/ChevronLeft';
import SettingTab from '../assets/svgs/SettingTab';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';
import CheckMarkHeart from '../assets/svgs/CheckMarkHeart';
import CrossIcon from '../assets/svgs/CrossIcon';
import { useAuthStore } from '../../store/authStore';
import { useNotificationInboxStore } from '../../store/notificationInboxStore';
import {
  fetchNotificationsForUser,
  formatNotificationTimeAgo,
  markAllNotificationsRead,
  type InAppNotificationRow,
} from '../lib/api/notifications';
import { newFoodNotificationDataToFoodDetailItem } from '../lib/notificationPayloadToFoodDetail';

const DEFAULT_LISTING_IMAGE = require('../assets/images/FoodOnboard1.png');

function buildDescription(row: InAppNotificationRow): string {
  const d = row.data ?? {};
  switch (row.type) {
    case 'new_food_available': {
      const title = typeof d.title === 'string' && d.title.trim() ? d.title.trim() : 'Food';
      const end = typeof d.endTime === 'string' && d.endTime.trim() ? d.endTime.trim() : null;
      if (end) return `New listing: ${title}. Pickup until ${end}.`;
      return `New listing: ${title} was posted near you.`;
    }
    case 'request_accepted':
      return typeof d.message === 'string' ? d.message : 'Your request was accepted. Ready for pickup!';
    case 'pickup_reminder':
      return typeof d.message === 'string'
        ? d.message
        : "Don't forget — your pickup window is closing soon.";
    case 'request_not_available':
      return typeof d.message === 'string'
        ? d.message
        : 'This listing is no longer available. Browse other food nearby.';
    default:
      return '';
  }
}

function foodTagForRow(row: InAppNotificationRow): string | undefined {
  const d = row.data ?? {};
  if (row.type === 'new_food_available') {
    const ft = typeof d.foodType === 'string' && d.foodType.trim() ? d.foodType.trim() : '';
    const title = typeof d.title === 'string' && d.title.trim() ? d.title.trim() : '';
    return ft || title || undefined;
  }
  if (typeof d.foodTitle === 'string' && d.foodTitle.trim()) return d.foodTitle.trim();
  return undefined;
}

export default function NotificationsScreen() {
  const isDark = useResolvedIsDark();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const profile = useAuthStore((s) => s.profile);
  const userId = profile?.id ?? null;
  const items = useNotificationInboxStore((s) => s.items);
  const loading = useNotificationInboxStore((s) => s.loading);
  const error = useNotificationInboxStore((s) => s.error);
  const setItems = useNotificationInboxStore((s) => s.setItems);
  const setError = useNotificationInboxStore((s) => s.setError);
  const markAllReadLocal = useNotificationInboxStore((s) => s.markAllReadLocal);

  const [refreshing, setRefreshing] = React.useState(false);

  const recipientLat =
    profile?.latitude != null && Number.isFinite(Number(profile.latitude))
      ? Number(profile.latitude)
      : null;
  const recipientLng =
    profile?.longitude != null && Number.isFinite(Number(profile.longitude))
      ? Number(profile.longitude)
      : null;

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      let active = true;
      markAllReadLocal(userId);
      void (async () => {
        await markAllNotificationsRead(userId);
        if (!active) return;
      })();
      return () => {
        active = false;
      };
    }, [userId, markAllReadLocal])
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    setError(null);
    const { data, error: fetchErr } = await fetchNotificationsForUser(userId);
    if (fetchErr) {
      setError(fetchErr.message);
    } else {
      setItems(data ?? [], userId);
    }
    setRefreshing(false);
  }, [userId, setItems, setError]);

  const rows = useMemo(() => {
    return items.map((row) => {
      const timeAgo = formatNotificationTimeAgo(row.created_at);
      const description = buildDescription(row);
      const foodTag = foodTagForRow(row);
      const unread = !row.is_read;

      let icon: React.ReactNode;
      let title: string;
      let titleSuffix: string | undefined;

      switch (row.type) {
        case 'request_accepted':
          icon = <CheckMarkHeart width={20} height={20} color={colors.primary} />;
          title = 'Request Accepted!';
          titleSuffix = '🎉';
          break;
        case 'pickup_reminder':
          icon = <ClockICon width={20} height={20} color={palette.logoutColor} />;
          title = 'Pickup Reminder';
          titleSuffix = '⏰';
          break;
        case 'new_food_available':
          icon = <LocationPin width={20} height={20} color={palette.timeIcon} />;
          title = 'New Food Available';
          titleSuffix = '🍽️';
          break;
        case 'request_not_available':
          icon = <CrossIcon width={20} height={20} color={palette.logoutColor} />;
          title = 'Request Not Available';
          titleSuffix = undefined;
          break;
        default:
          icon = <LocationPin width={20} height={20} color={palette.timeIcon} />;
          title = 'Notification';
          titleSuffix = undefined;
      }

      return { row, icon, title, titleSuffix, description, foodTag, timeAgo, unread };
    });
  }, [items, colors.primary]);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleSettingsPress = () => {
    navigation.navigate('NotificationSettingsScreen');
  };

  const handleRowPress = (row: InAppNotificationRow) => {
    if (row.type !== 'new_food_available') return;
    const item = newFoodNotificationDataToFoodDetailItem(
      row.data ?? {},
      recipientLat,
      recipientLng,
      DEFAULT_LISTING_IMAGE
    );
    if (item) {
      navigation.navigate('FoodDetailScreen', { item });
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <SettingsHeader
        title="Notifications"
        onLeftPress={handleBack}
        onRightPress={handleSettingsPress}
        leftIcon={<ChevronLeft width={24} height={24} color={colors.text} />}
        rightIcon={<SettingTab width={22} height={22} color={colors.text} />}
      />
      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.textSecondary, fontFamily: fontFamilies.inter }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={[styles.retryBtn, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontFamily: fontFamilies.interMedium }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.roleBulbColor2}
              titleColor={palette.roleBulbColor2}
              colors={[palette.roleBulbColor2]}
              progressBackgroundColor={isDark ? colors.inputFieldBg : palette.white}
            />
          }
        >
          {rows.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
                ]}
              >
                No notifications yet
              </Text>
              <Text
                style={[
                  styles.emptySub,
                  { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
                ]}
              >
                When food is posted near you, it will show up here.
              </Text>
            </View>
          ) : (
            rows.map(({ row, icon, title, titleSuffix, description, foodTag, timeAgo, unread }) => (
              <TouchableOpacity
                key={row.id}
                activeOpacity={row.type === 'new_food_available' ? 0.85 : 1}
                onPress={() => handleRowPress(row)}
                disabled={row.type !== 'new_food_available'}
              >
                <NotificationCard
                  icon={icon}
                  title={title}
                  titleSuffix={titleSuffix}
                  description={description}
                  foodTag={foodTag}
                  timeAgo={timeAgo}
                  unread={unread}
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyWrap: { paddingTop: 48, paddingHorizontal: 8 },
  emptyTitle: { marginBottom: 8 },
  emptySub: { lineHeight: 20 },
});
