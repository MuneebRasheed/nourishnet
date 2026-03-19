import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, Pressable, Text, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResolvedIsDark } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import { AuthInput } from '../components/AuthInput';
import ContinueButton from '../components/ContinueButton';
import LockIcon from '../assets/svgs/LockIcon';
import ChevronLeft from '../assets/svgs/ChevronLeft';
import { API_BASE_URL } from '../lib/api/client';
import { supabase } from '../lib/supabase';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/authStore';

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const profileEmail = useAuthStore((s) => s.profile?.email);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const lockIcon = <LockIcon width={20} height={20} color={colors.text} />;

  const showThemedModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleUpdate = async () => {
    if (updating) return;
    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedOld) {
      showThemedModal('Error', 'Please enter your current password.');
      return;
    }
    if (!trimmedNew) {
      showThemedModal('Error', 'Please enter a new password.');
      return;
    }
    if (trimmedNew.length < MIN_PASSWORD_LENGTH) {
      showThemedModal('Error', `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      showThemedModal('Error', 'New password and confirmation do not match.');
      return;
    }

    setUpdating(true);
    try {
      const changeViaServer = async (): Promise<boolean> => {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) return false;

        const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            currentPassword: trimmedOld,
            newPassword: trimmedNew,
          }),
        });

        if (res.ok) return true;

        const data = await res.json().catch(() => ({} as Record<string, unknown>));
        const msg = String(data?.error ?? data?.message ?? '');

        // If token/session is stale, we'll fallback to re-auth + direct Supabase update below.
        if (res.status === 401 || msg.toLowerCase().includes('session') || msg.toLowerCase().includes('token')) {
          return false;
        }

        showThemedModal('Error', msg || 'Failed to update password.');
        return true; // handled (shown)
      };

      const changeViaReauth = async (): Promise<boolean> => {
        const emailForReauth = profileEmail?.trim() ?? '';
        if (!emailForReauth) {
          showThemedModal('Error', 'Auth session missing. Please sign in again.');
          return false;
        }

        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: emailForReauth,
          password: trimmedOld,
        });
        if (reauthError) {
          showThemedModal('Error', 'Current password is incorrect.');
          return false;
        }

        const { error: updateUserError } = await supabase.auth.updateUser({
          password: trimmedNew,
        });
        if (updateUserError) {
          showThemedModal('Error', updateUserError.message ?? 'Failed to update password.');
          return false;
        }
        return true;
      };

      let changed = await changeViaServer();
      if (!changed) {
        changed = await changeViaReauth();
      }
      if (!changed) return;

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showThemedModal('Done', 'Your password has been updated.');
    } catch {
      showThemedModal('Error', 'Failed to update password.');
    } finally {
      setUpdating(false);
    }
  };

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
        title="Change Password"
        onLeftPress={handleBack}
        leftIcon={<ChevronLeft width={24} height={24} color={colors.text} />}
        contentPaddingHorizontal={16}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <AuthInput
          type="password"
          label="Old Password"
          placeholder="••••••••"
          value={oldPassword}
          onChangeText={setOldPassword}
          leftIcon={lockIcon}
          showPasswordToggle={true}
          toggleVisibilityOnLeftIconPress
          containerStyle={styles.input}
        />
        <AuthInput
          type="password"
          label="New Password"
          placeholder="••••••••"
          value={newPassword}
          onChangeText={setNewPassword}
          leftIcon={lockIcon}
          showPasswordToggle={false}
          toggleVisibilityOnLeftIconPress
          containerStyle={styles.input}
        />
        <AuthInput
          type="password"
          label="Confirm New Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          leftIcon={lockIcon}
          showPasswordToggle={false}
          toggleVisibilityOnLeftIconPress
          containerStyle={styles.input}
        />
        <ContinueButton
          label={updating ? 'Updating…' : 'Update'}
          onPress={handleUpdate}
          isDark={isDark}
          style={styles.updateBtn}
        />
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalBlurContainer} pointerEvents="none">
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={10}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.modalAndroidOverlay]} />
            )}
            <View style={[StyleSheet.absoluteFill, styles.modalOverlayBg]} />
          </View>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.inputFieldBg },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  color: modalTitle === 'Done' ? colors.primary : colors.text,
                  fontFamily: fontFamilies.poppinsSemiBold,
                  fontSize: fonts.largeTitle,
                },
              ]}
            >
              {modalTitle}
            </Text>
            <Text
              style={[
                styles.modalMessage,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {modalMessage}
            </Text>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setModalVisible(false);
                if (modalTitle === 'Done') {
                  navigation.replace('MainTabs', { screen: 'Settings' });
                }
              }}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  { color: palette.white, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
                ]}
              >
                OK
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingTop: 24,
  },
  input: {
    marginBottom: 20,
  },
  updateBtn: {
    marginTop: 16,
  },
  modalOverlay: {
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
  modalBlurContainer: {
    ...StyleSheet.absoluteFillObject,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalAndroidOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalOverlayBg: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 40,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: 8,
  },
  modalMessage: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
  },
});
