import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResolvedIsDark } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import NotificationCard from '../components/NotificationCard';
import ChevronLeft from '../assets/svgs/ChevronLeft';
import SettingTab from '../assets/svgs/SettingTab';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';
import CheckMarkHeart from '../assets/svgs/CheckMarkHeart';
import CrossIcon from '../assets/svgs/CrossIcon';

export default function NotificationsScreen() {
  const isDark = useResolvedIsDark();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const colors = getColors(isDark);

  const mockNotifications = [
    {
      id: '1',
      type: 'accepted' as const,
      icon: <CheckMarkHeart width={20} height={20} color={colors.primary} />,
      title: 'Request Accepted!',
      titleSuffix: '🎉',
      description:
        'Green Spice Restaurant accepted your request for Fresh Vegetable Biryani. Ready for pickup!',
      foodTag: 'Fresh Vegetable Biryani',
      timeAgo: '5m ago',
      unread: true,
    },
    {
      id: '2',
      type: 'reminder' as const,
      icon: <ClockICon width={20} height={20} color={palette.logoutColor} />,
      title: 'Pickup Reminder',
      titleSuffix: '⏰',
      description:
        "Don't forget! Pickup window for Assorted Sandwiches closes at 6:30 PM today.",
      foodTag: 'Assorted Sandwiches',
      timeAgo: '30m ago',
      unread: true,
    },
    {
      id: '3',
      type: 'available' as const,
      icon: <LocationPin width={20} height={20} color={palette.timeIcon} />,
      title: 'New Food Available',
      titleSuffix: '🍽️',
      description: 'Fresh Pasta available 1.5 km away. Pickup until 8:00 PM.',
      foodTag: undefined,
      timeAgo: '1h ago',
      unread: false,
    },
    {
      id: '4',
      type: 'unavailable' as const,
      icon: <CrossIcon width={20} height={20} color={palette.logoutColor} />,
      title: 'Request Not Available',
      titleSuffix: undefined,
      description:
        'Unfortunately, Mixed Fruit Salad is no longer available. Check out other listings!',
      foodTag: 'Mixed Fruit Salad',
      timeAgo: '2h ago',
      unread: false,
    },
  ];

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleSettingsPress = () => {
    navigation.navigate('NotificationSettingsScreen');
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {mockNotifications.map((item) => (
          <NotificationCard
            key={item.id}
            icon={item.icon}
            title={item.title}
            titleSuffix={item.titleSuffix}
            description={item.description}
            foodTag={item.foodTag}
            timeAgo={item.timeAgo}
            unread={item.unread}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
});
