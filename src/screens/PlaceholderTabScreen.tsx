import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { MainTabParamList } from '../navigations/MainTabNavigator';

export default function PlaceholderTabScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<MainTabParamList, keyof MainTabParamList>>();
  const title = route.name;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fontFamilies.poppinsSemiBold, fontSize: fonts.largeTitle }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.body }]}>
        Coming soon
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {},
  subtitle: {
    marginTop: 8,
  },
});
