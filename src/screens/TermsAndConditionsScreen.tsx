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
        title="Terms of Use"
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
          Welcome to NourishNet. By using our app, you agree to these Terms of Use. Please read them carefully.
        </Text>

        <Text style={sectionTitle}>Acceptance of Terms</Text>
        <Text style={body}>
          By accessing or using NourishNet, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, please do not use our services.
        </Text>

        <Text style={sectionTitle}>Subscription Terms</Text>
        <Text style={body}>
          NourishNet offers auto-renewable subscription plans (Pro) with the following terms:
        </Text>
        <Text style={bullet}>• Subscriptions are billed monthly or annually based on your selected plan</Text>
        <Text style={bullet}>• Payment will be charged to your App Store account at confirmation of purchase</Text>
        <Text style={bullet}>• Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period</Text>
        <Text style={bullet}>• Your account will be charged for renewal within 24 hours prior to the end of the current period</Text>
        <Text style={bullet}>• You can manage your subscription and turn off auto-renewal in your App Store account settings</Text>
        <Text style={bullet}>• No refunds will be provided for any unused portion of the subscription term</Text>
        <Text style={bullet}>• Any unused portion of a free trial period will be forfeited when you purchase a subscription</Text>

        <Text style={sectionTitle}>User Responsibilities</Text>
        <Text style={body}>You agree to:</Text>
        <Text style={bullet}>• Provide accurate and complete information</Text>
        <Text style={bullet}>• Maintain the security of your account credentials</Text>
        <Text style={bullet}>• Use the service in compliance with all applicable laws</Text>
        <Text style={bullet}>• Not misuse or abuse the platform</Text>
        <Text style={bullet}>• Respect other users and community guidelines</Text>

        <Text style={sectionTitle}>Service Availability</Text>
        <Text style={body}>
          We strive to provide reliable service but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time.
        </Text>

        <Text style={sectionTitle}>Intellectual Property</Text>
        <Text style={body}>
          All content, features, and functionality of NourishNet are owned by us and are protected by copyright, trademark, and other intellectual property laws.
        </Text>

        <Text style={sectionTitle}>Limitation of Liability</Text>
        <Text style={body}>
          To the maximum extent permitted by law, NourishNet shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
        </Text>

        <Text style={sectionTitle}>Changes to Terms</Text>
        <Text style={body}>
          We may update these Terms of Use from time to time. We will notify you of any changes by posting the new Terms of Use on this page and updating the "Last updated" date. Your continued use of the service after changes constitutes acceptance of the new terms.
        </Text>

        <Text style={sectionTitle}>Contact Us</Text>
        <Text style={body}>
          If you have any questions about these Terms of Use, please contact us through the app support section.
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
