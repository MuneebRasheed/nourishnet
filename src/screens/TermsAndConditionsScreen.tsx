import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResolvedIsDark } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import ChevronLeft from '../assets/svgs/ChevronLeft';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

export default function TermsAndConditionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const sectionTitle = [styles.sectionTitle, { color: colors.text, fontFamily: fontFamilies.poppinsSemiBold, fontSize: fonts.subhead }];
  const body = [styles.body, { color: colors.textSecondary ?? colors.text, fontSize: fonts.body }];
  const bullet = [styles.bullet, { color: colors.textSecondary ?? colors.text, fontSize: fonts.body }];

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <SettingsHeader
        title="Terms & conditions"
        onLeftPress={handleBack}
        leftIcon={<ChevronLeft width={24} height={24} color={colors.text} />}
        contentPaddingHorizontal={16}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.textSecondary ?? colors.text, fontSize: fonts.caption }]}>
          Last updated: October 21, 2025
        </Text>
        <Text style={body}>
          This Privacy Policy describes how we collect, use, and handle your information when you use our services.
        </Text>

        <Text style={sectionTitle}>Information Collection</Text>
        <Text style={body}>We collect several types of information for various purposes:</Text>
        <Text style={bullet}>• Personal Information (email address, name)</Text>
        <Text style={bullet}>• Usage Data (app features accessed, time spent)</Text>
        <Text style={bullet}>• Device Information (IP address, browser type)</Text>
        <Text style={bullet}>• Cookies and Tracking Data</Text>

        <Text style={sectionTitle}>How We Use Your Information</Text>
        <Text style={body}>We use the collected information for:</Text>
        <Text style={bullet}>• Providing and maintaining our services</Text>
        <Text style={bullet}>• Notifying you about changes to our services</Text>
        <Text style={bullet}>• Providing customer support</Text>
        <Text style={bullet}>• Detecting and preventing technical issues</Text>

        <Text style={sectionTitle}>Data Storage and Security</Text>
        <Text style={body}>
          Your data security is important to us. We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of your information.
        </Text>
        <Text style={bullet}>• Data encryption in transit and at rest</Text>
        <Text style={bullet}>• Regular security assessments</Text>
        <Text style={bullet}>• Limited access to personal information</Text>
        <Text style={bullet}>• Secure data storage facilities</Text>

        <Text style={sectionTitle}>Updates to Policy</Text>
        <Text style={body}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  updated: {
    marginBottom: 12,
  },
  body: {
    fontFamily: fontFamilies.inter,
    marginBottom: 12,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
  },
  bullet: {
    fontFamily: fontFamilies.inter,
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 22,
  },
});
