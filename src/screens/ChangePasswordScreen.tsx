import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResolvedIsDark } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import { AuthInput } from '../components/AuthInput';
import ContinueButton from '../components/ContinueButton';
import LockIcon from '../assets/svgs/LockIcon';
import ChevronLeft from '../assets/svgs/ChevronLeft';
import { API_BASE_URL } from '../lib/api/client';

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDark = useResolvedIsDark();
  const colors = getColors(isDark);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const lockIcon = <LockIcon width={20} height={20} color={colors.text} />;

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleUpdate = async () => {
    if (updating) return;
    const trimmedOld = oldPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedOld) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    if (!trimmedNew) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }
    if (trimmedNew.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Error', `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: trimmedOld,
          newPassword: trimmedNew,
        }),
      });
      const data = res.ok ? null : await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', (data?.message as string) ?? 'Failed to update password.');
        return;
      }
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Done', 'Your password has been updated.');
    } catch {
      Alert.alert('Error', 'Failed to update password.');
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
});
