import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolvedIsDark } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { TasksHeader } from '../components/TasksHeader';
import SettingsRow from '../components/SettingsRow';
import CustomSwitch from '../components/CustomSwitch';
import BellIcon from '../assets/svgs/BellIcon';

export default function NotificationSettingsScreen() {
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom },
      ]}
    >
      <TasksHeader
        title="Notification settings"
        isDark={isDark}
        paddingTop={insets.top}
        showBackButton={true}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
          ]}
        >
          Manage how you receive updates
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.inputFieldBg },
            !isDark && { borderWidth: 1, borderColor: colors.borderColor },
          ]}
        >
          <SettingsRow
            iconComponent={<BellIcon width={20} height={20} stroke={colors.text} />}
            label="Push notifications"
            showChevron={false}
            isLast={true}
            rightElement={
              <CustomSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: isDark ? palette.white : palette.settingsIconBg,
                  true: colors.primary,
                }}
                thumbColor={palette.largeFontbutton}
                trackBorderColor={colors.borderColor}
              />
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { marginBottom: 12, marginLeft: 4 },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
