import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { AuthInput } from '../components/AuthInput';
import ContinueButton from '../components/ContinueButton';
import { TasksHeader } from '../components/TasksHeader';
import type { RootStackParamList } from '../navigations/RootNavigation';
import { API_BASE_URL } from '../lib/api/client';

const MIN_PASSWORD_LENGTH = 6;

type Props = NativeStackScreenProps<RootStackParamList, 'CreateNewPasswordScreen'>;

export default function CreateNewPasswordScreen({ route }: Props) {
  const { email, otp } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'CreateNewPasswordScreen'>>();
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-reset-otp-and-set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? 'Failed to set password. Please try again.');
        return;
      }
      navigation.replace('LoginScreen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TasksHeader isDark={isDark} paddingTop={insets.top} title="New Password" showBackButton />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.instruction,
            {
              color: colors.textSecondary,
              fontSize: fonts.body,
              fontFamily: fontFamilies.inter,
            },
          ]}
        >
          Enter your new password below.
        </Text>
        <AuthInput
          type="password"
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          showPasswordToggle
        />
        <AuthInput
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          showPasswordToggle
        />
        {error ? (
          <Text style={[styles.errorText, { color: '#dc2626', fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
            {error}
          </Text>
        ) : null}
        <ContinueButton
          label={loading ? 'Setting password...' : 'Set Password'}
          onPress={handleSubmit}
          isDark={isDark}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  instruction: { marginBottom: 24 },
  errorText: { marginTop: 12, marginBottom: 16 },
});
