import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { getColors, palette } from '../../utils/colors';
import HomeScreen from '../screens/HomeScreen';
import ProviderHomeScreen from '../screens/ProviderHomeScreen';
import MyRequestsScreen from '../screens/MyRequestsScreen';
import SearchTabScreenMain from '../screens/SearchTabScreenMain';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HomeTab from '../assets/svgs/HomeTab';
import HomeTabFill from '../assets/svgs/HomeTabFill';
import HeartTab from '../assets/svgs/HeartTab';
import HeartTabFill from '../assets/svgs/HeartTabFill';
import SearchTab from '../assets/svgs/SearchTab';
import SeachTabFill from '../assets/svgs/SeachTabFill';
import DoubleLineTab from '../assets/svgs/DoubleLineTab';
import DoubleLineFill from '../assets/svgs/DoubleLineFill';
import SettingTab from '../assets/svgs/SettingTab';
import SettingTabFill from '../assets/svgs/SettingTabFill';
import ListingIcon from '../assets/svgs/ListingIcon';
import SearchNavigationStack from './SearchNavigationStack';
import ListingsNavigationStack from './ListingsNavigationStack';

export type MainTabParamList = {
  Home: undefined;
  Favorites: undefined;
  Search: undefined;
  Listings: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_HEIGHT = 66;
const TAB_ICON_SIZE = 24;

function MainTabNavigator() {
  const theme = useThemeStore((s) => s.theme);
  const userRole = useAuthStore((s) => s.userRole);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const inactiveGreen = 'rgba(82, 151, 109, 0.6)';
  const iconColor = (focused: boolean) => (focused ? palette.white : inactiveGreen);
  const HomeComponent = userRole === 'provider' ? ProviderHomeScreen : HomeScreen;

  const renderTabIcon = (IconComponent: React.ComponentType<{ width?: number; height?: number; color?: string }>, focused: boolean) => (
    <View style={[styles.iconWrap, focused && { backgroundColor: colors.primary }]}>
      <IconComponent width={TAB_ICON_SIZE} height={TAB_ICON_SIZE} color={iconColor(focused)} />
    </View>
  );

  const isProvider = userRole === 'provider';

  return (
    <Tab.Navigator
      id="MainTabNavigator"
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: '#2e3842',
            shadowColor: '#0000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 14,
            elevation: 8,
          },
        ],
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.inputFieldBg, borderRadius: 56 }]} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: inactiveGreen,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeComponent}
        options={{
          tabBarIcon: ({ focused }) => renderTabIcon(focused ? HomeTabFill : HomeTab, focused),
        }}
      />
      {isProvider ? (
        <Tab.Screen
          name="Listings"
          component={ListingsNavigationStack}
          options={{
            tabBarIcon: ({ focused }) => renderTabIcon(ListingIcon, focused),
          }}
        />
      ) : (
        <>
          <Tab.Screen
            name="Favorites"
            component={MyRequestsScreen}
            options={{
              tabBarIcon: ({ focused }) => renderTabIcon(focused ? HeartTabFill : HeartTab, focused),
            }}
          />
          <Tab.Screen
            name="Search"
            component={SearchNavigationStack}
            options={{
              tabBarIcon: ({ focused }) => renderTabIcon(focused ? SeachTabFill : SearchTab, focused),
            }}
          />
        </>
      )}
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused }) => renderTabIcon(focused ? DoubleLineFill : DoubleLineTab, focused),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => renderTabIcon(focused ? SettingTabFill : SettingTab, focused),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 0,
    height: TAB_BAR_HEIGHT,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderRadius: 56,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',

  },
});

export default MainTabNavigator;
