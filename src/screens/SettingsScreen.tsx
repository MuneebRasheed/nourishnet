import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { getDisplayName, getAvatarLetter } from '../lib/profile';
import { useThemeStore, useResolvedIsDark } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingStore';
import { useAuthStore } from '../../store/authStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import SettingsProfileCard from '../components/SettingsProfileCard';
import SettingsRow from '../components/SettingsRow';
import CustomSwitch from '../components/CustomSwitch';
import ContinueButton from '../components/ContinueButton';
import Logout from '../assets/svgs/Logout';
import SplashIcon from '../assets/svgs/SplashIcon';
import PartnerIcon from '../assets/svgs/PartnerIcon';
import BellIcon from '../assets/svgs/BellIcon';
import PrivacyIcon from '../assets/svgs/PrivacyIcon';
import LockIcon from '../assets/svgs/LockIcon';
import Ticon from '../assets/svgs/Ticon';
import LightIcon from '../assets/svgs/LightIcon';
import DeleteIcon from '../assets/svgs/DeleteIcon';
import CrownIcon from '../assets/svgs/CrownIcon';
import KingIcon from '../assets/svgs/KingIcon';
import { fetchStreakTextApi } from '../lib/api/analytics';
import { API_BASE_URL } from '../lib/api/client';
export default function SettingsScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userRole = useAuthStore((s) => s.userRole);
  const profile = useAuthStore((s) => s.profile);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const largeFont = useSettingsStore((s) => s.largeFont);
  const setLargeFont = useSettingsStore((s) => s.setLargeFont);
  const isProvider = userRole === 'provider';
  const [streakText, setStreakText] = useState('0-day streak');

  const headerTop = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, 16),
    default: insets.top,
  });

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen', {});
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      // If token is already missing, treat user as logged out.
      if (!(msg.includes('refresh token') && msg.includes('not found'))) {
        Alert.alert('Logout failed', error.message ?? 'Please try again.');
        return;
      }
    }
    clearAuth();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      })
    );
  };

  const handleSubscriptionManagement = () => {
    navigation.navigate('SubscriptionManagementScreen');
  };

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await handleLogout();
  };

  const handleDeactivateConfirm = async () => {
    if (deactivateLoading) return;
    setDeactivateLoading(true);
    try {
      await supabase.auth.refreshSession().catch(() => {});
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert('Session expired', 'Please sign in again.');
        setShowDeactivateModal(false);
        return;
      }
      const base = API_BASE_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/auth/delete-user`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const text = await res.text();
      let body: { success?: boolean; error?: string } = {};
      try {
        body = text ? (JSON.parse(text) as typeof body) : {};
      } catch {
        Alert.alert(
          'Could not delete account',
          'The server did not return a valid response. Check EXPO_PUBLIC_API_URL and that your API is running.'
        );
        return;
      }
      if (body.error) {
        Alert.alert('Could not delete account', String(body.error));
        return;
      }
      if (!body.success) {
        Alert.alert(
          'Could not delete account',
          'The account was not removed. Confirm your API has SUPABASE_SERVICE_ROLE_KEY set and POST /auth/delete-user is reachable.'
        );
        return;
      }
      setShowDeactivateModal(false);
      await supabase.auth.signOut().catch(() => {});
      await AsyncStorage.multiRemove([
        'nourishnet-auth',
        'nourishnet_onboarding_completed',
      ]).catch(() => {});
      clearAuth();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        })
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userRole !== 'provider' && userRole !== 'recipient') return;
      const { streakText: text } = await fetchStreakTextApi(userRole);
      if (!cancelled) setStreakText(text);
    })();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
      <View style={[styles.header, { marginTop: headerTop }]}>
        <SettingsHeader title="Setting" />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
   

        <SettingsProfileCard
          displayName={getDisplayName(profile) || 'User'}
          subtitle={streakText}
          avatarLetter={getAvatarLetter(profile)}
          avatarSource={profile?.avatar_url ? { uri: profile.avatar_url } : undefined}
          onEditPress={handleEditProfile}
          showPremium={isProvider}
        />

        <View style={styles.sectionWrapper}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fontFamilies.poppinsSemiBold, fontSize: fonts.subhead },
            ]}
          >
            Account
          </Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              backgroundColor={colors.inputFieldBg}
              iconComponent={<PartnerIcon width={20} height={20} stroke={colors.text} />}
              label="Edit Profile"
              onPress={handleEditProfile}
              isLast={false}
            />
            <SettingsRow
              backgroundColor={colors.inputFieldBg}
              iconComponent={<BellIcon width={20} height={20} stroke={colors.text} />}
              label="Notifications"
              onPress={() => navigation.navigate('NotificationsScreen')}
              isLast={false}
            />
            <SettingsRow
              backgroundColor={colors.inputFieldBg}
              iconComponent={<LockIcon width={20} height={20} color={colors.text} />}
              label="Change password"
              onPress={() => navigation.navigate('ChangePasswordScreen')}
              isLast={true}
            />
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fontFamilies.poppinsSemiBold, fontSize: fonts.subhead },
            ]}
          >
            Appearance
          </Text>
          <View style={styles.sectionCard}>
            <SettingsRow
            backgroundColor={colors.inputFieldBg}
              iconComponent={<Ticon width={20} height={20} color={colors.text} />}
              label="Large Font"
              showChevron={false}
              isLast={false}
              rightElement={
                <CustomSwitch
                  value={largeFont}
                  onValueChange={setLargeFont}
                  trackColor={{
                    false: isDark ? palette.white : palette.settingsIconBg,
                    true: colors.primary,
                  }}
                  thumbColor={palette.largeFontbutton}
                  trackBorderColor={colors.borderColor}
                />
              }
            />
            <SettingsRow
              backgroundColor={colors.inputFieldBg}
              iconComponent={<LightIcon width={20} height={20} color={colors.text} />}
              label="Theme"
              onPress={() => navigation.navigate('ThemeScreen')}
              isLast={true}
            />
          </View>
        </View>

        {isProvider && (
          <View style={styles.sectionWrapper}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fontFamilies.poppinsSemiBold, fontSize: fonts.subhead },
              ]}
            >
              Subscription
            </Text>
            <View style={styles.sectionCard}>
              <SettingsRow
                backgroundColor={colors.inputFieldBg}
                iconComponent={<KingIcon width={20} height={20} color={colors.text} />}
                label="Subscription Management"
                onPress={handleSubscriptionManagement}
                isLast={true}
              />
            </View>
          </View>
        )}

        <View style={styles.sectionWrapper}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontFamily: fontFamilies.poppinsSemiBold, fontSize: fonts.subhead },
            ]}
          >
            Other Setting
          </Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              backgroundColor={colors.inputFieldBg}
              icon="document-text-outline"
              label="Terms & conditions"
              onPress={() => navigation.navigate('TermsAndConditionsScreen')}
              isLast={false}
            />
            <SettingsRow
              backgroundColor={colors.inputFieldBg}
              iconComponent={<PrivacyIcon width={20} height={20} stroke={colors.text} />}
              label="Privacy policy"
              onPress={() => navigation.navigate('PrivacyPolicyScreen')}
              isLast={false}
            />
            <SettingsRow
              backgroundColor={colors.inputFieldBg}
              iconComponent={<DeleteIcon width={20} height={20} />}
              label="Deactivate account"
              onPress={() => setShowDeactivateModal(true)}
              isLast={true}
              labelColor={palette.logoutColor}
              iconBg={isDark ?  colors.inputFieldBg:palette.logoutIconBg }
            />
          </View>
        </View>

       

        <ContinueButton
          label="Logout"
          onPress={() => setShowLogoutModal(true)}
          isDark={isDark}
          backgroundColor={colors.inputFieldBg}
          textColor={palette.logoutColor}
          icon={<Logout width={22} height={22} />}
          iconPosition="left"
          style={styles.logoutButton}
        />
      </ScrollView>

      <Modal
        visible={showDeactivateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeactivateModal(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.deactivateModalOverlay}
          onPress={() => setShowDeactivateModal(false)}
        >
          <View style={styles.deactivateModalBlurContainer} pointerEvents="none">
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={10}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.deactivateModalAndroidOverlay]} />
            )}
            <View style={[StyleSheet.absoluteFill, styles.deactivateModalOverlayBg]} />
          </View>
          <Pressable
            style={[styles.deactivateModalContent, { backgroundColor: colors.inputFieldBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={[
                styles.deactivateModalTitle,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.interBold,
                  fontSize: fonts.largeTitle,
                },
              ]}
            >
              Deactivate
            </Text>
            <Text
              style={[
                styles.deactivateModalMessage,
                {
                  color: colors.textSecondary ?? colors.text,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              This permanently deletes your account and profile on the server. You cannot undo this.
            </Text>
            <View style={styles.deactivateModalButtons}>
              <Pressable
                style={[
                  styles.deactivateModalCancelBtn,
                  {
                    backgroundColor: palette.white,
                    borderColor: colors.borderColor,
                  },
                ]}
                onPress={() => setShowDeactivateModal(false)}
              >
                <Text
                  style={[
                    styles.deactivateModalCancelText,
                    {
                      color: colors.textSecondary ?? colors.text,
                      fontFamily: fontFamilies.interSemiBold,
                      fontSize: fonts.subhead,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.deactivateModalConfirmBtn,
                  { backgroundColor: palette.logoutColor, opacity: deactivateLoading ? 0.7 : 1 },
                ]}
                onPress={handleDeactivateConfirm}
                disabled={deactivateLoading}
              >
                {deactivateLoading ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <Text
                    style={[
                      styles.deactivateModalConfirmText,
                      {
                        color: palette.white,
                        fontFamily: fontFamilies.interSemiBold,
                        fontSize: fonts.subhead,
                      },
                    ]}
                  >
                    Deactivate
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.deactivateModalOverlay}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={styles.deactivateModalBlurContainer} pointerEvents="none">
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={10}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.deactivateModalAndroidOverlay]} />
            )}
            <View style={[StyleSheet.absoluteFill, styles.deactivateModalOverlayBg]} />
          </View>
          <Pressable
            style={[styles.deactivateModalContent, { backgroundColor: colors.inputFieldBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={[
                styles.deactivateModalTitle,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.interBold,
                  fontSize: fonts.largeTitle,
                },
              ]}
            >
              Log out
            </Text>
            <Text
              style={[
                styles.deactivateModalMessage,
                {
                  color: colors.textSecondary ?? colors.text,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              Are you sure you want to log out?
            </Text>
            <View style={styles.deactivateModalButtons}>
              <Pressable
                style={[
                  styles.deactivateModalCancelBtn,
                  {
                    backgroundColor: palette.white,
                    borderColor: colors.borderColor,
                  },
                ]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text
                  style={[
                    styles.deactivateModalCancelText,
                    {
                      color: colors.textSecondary ?? colors.text,
                      fontFamily: fontFamilies.interSemiBold,
                      fontSize: fonts.subhead,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.deactivateModalConfirmBtn, { backgroundColor: palette.logoutColor }]}
                onPress={handleLogoutConfirm}
              >
                <Text
                  style={[
                    styles.deactivateModalConfirmText,
                    {
                      color: palette.white,
                      fontFamily: fontFamilies.interSemiBold,
                      fontSize: fonts.subhead,
                    },
                  ]}
                >
                  Log out
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // marginTop set dynamically via insets for responsive safe area on all devices
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionWrapper: {
    marginTop: 20,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' ? { elevation: 0 } : { elevation: 2 }),
  },
  aboutCard: {
    borderRadius: 21,
    paddingVertical: 21,
  
    alignItems: 'center',
  
  },
  aboutLogoWrap: {
    marginBottom: 12,
  },
  aboutAppName: {},
  aboutVersion: {
    marginTop: 4,
  },
  aboutSlogan: {
    marginTop: 2,
    opacity: 0.9,
  },
  logoutButton: {
    marginTop: 20,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === 'android' ? { elevation: 0 } : { elevation: 2 }),
    paddingVertical:16,
  },
  aboutVersionWrap:{gap:6,alignItems:'center'},
  // Deactivate modal
  deactivateModalOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deactivateModalBlurContainer: {
    ...StyleSheet.absoluteFillObject,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  deactivateModalAndroidOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  deactivateModalOverlayBg: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deactivateModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  deactivateModalTitle: {
    marginBottom: 12,
  },
  deactivateModalMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deactivateModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deactivateModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deactivateModalCancelText: {},
  deactivateModalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateModalConfirmText: {},
});
