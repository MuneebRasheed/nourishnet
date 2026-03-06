import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingStore';
import { getFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { getColors } from '../../utils/colors';

export default function ThemeFontsTestScreen() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const largeFont = useSettingsStore((state) => state.largeFont);
  const toggleLargeFont = useSettingsStore((state) => state.toggleLargeFont);
  const fontSizes = getFontSizes(largeFont);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.text,
            fontSize: fontSizes.title,
            fontFamily: fontFamilies.poppinsSemiBold,
          },
        ]}
      >
        Theme & font test
      </Text>

      {/* Theme */}
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: fontSizes.subhead,
            fontFamily: fontFamilies.poppins,
          },
        ]}
      >
        Theme
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: colors.textSecondary,
            fontSize: fontSizes.caption,
            fontFamily: fontFamilies.inter,
          },
        ]}
      >
        Current: {theme}
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setTheme('light')}
          style={[
            styles.button,
            {
              backgroundColor: theme === 'light' ? colors.primary : colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: theme === 'light' ? colors.background : colors.text,
                fontSize: fontSizes.body,
                fontFamily: fontFamilies.poppinsMedium,
              },
            ]}
          >
            Light
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTheme('dark')}
          style={[
            styles.button,
            {
              backgroundColor: theme === 'dark' ? colors.primary : colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: theme === 'dark' ? colors.background : colors.text,
                fontSize: fontSizes.body,
                fontFamily: fontFamilies.poppinsMedium,
              },
            ]}
          >
            Dark
          </Text>
        </Pressable>
      </View>

      {/* Font size */}
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: fontSizes.subhead,
            fontFamily: fontFamilies.poppins,
          },
        ]}
      >
        Font size
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: colors.textSecondary,
            fontSize: fontSizes.caption,
            fontFamily: fontFamilies.inter,
          },
        ]}
      >
        Current: {largeFont ? 'Large' : 'Normal'}
      </Text>
      <Pressable
        onPress={toggleLargeFont}
        style={[
          styles.buttonFull,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: colors.text,
              fontSize: fontSizes.body,
              fontFamily: fontFamilies.poppinsBold,
            },
          ]}
        >
          {largeFont ? 'Use normal font size' : 'Use large font size'}
        </Text>
      </Pressable>

      {/* Preview text */}
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: fontSizes.subhead,
            fontFamily: fontFamilies.poppins,
          },
        ]}
      >
        Preview (responsive)
      </Text>
      <Text
        style={[
          styles.preview,
          {
            color: colors.text,
            fontSize: fontSizes.body,
            fontFamily: fontFamilies.poppins,
          },
        ]}
      >
        Body: The quick brown fox. Font size responds to your setting above.
      </Text>
      <Text
        style={[
          styles.preview,
          {
            color: colors.text,
            fontSize: fontSizes.caption,
            fontFamily: fontFamilies.inter,
          },
        ]}
      >
        Caption: Small text sample.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  label: {
    marginTop: 16,
  },
  value: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonFull: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: {},
  preview: {
    marginTop: 4,
  },
});
