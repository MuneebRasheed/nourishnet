import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ClockIcon from '../assets/svgs/ClockICon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import ContinueButton from '../components/ContinueButton';
import { TasksHeader } from '../components/TasksHeader';
import type { RootStackParamList } from '../navigations/RootNavigation';
import { API_BASE_URL } from '../lib/api/client';
import { supabase } from '../lib/supabase';

const CODE_EXPIRE_SECONDS = 15 * 60;

type Props = NativeStackScreenProps<RootStackParamList, 'VerificationCodeScreen'>;

const CODE_LENGTH = 6;

export default function VerificationCodeScreen({ route }: Props) {
  const { email = '', role, context = 'signup', password } = route.params ?? {};
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'VerificationCodeScreen'>>();
  const insets = useSafeAreaInsets();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fontSizes = useAppFontSizes();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(CODE_EXPIRE_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const displayDestination = email || 'your email';

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (error) setError('');
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError('');
    const otp = code.join('');
    if (otp.length !== CODE_LENGTH) {
      setError(`Please enter the full ${CODE_LENGTH}-digit code.`);
      return;
    }
    setLoading(true);
    try {
      if (context === 'forgot-password') {
        const res = await fetch(`${API_BASE_URL}/auth/verify-reset-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body?.error ?? 'Invalid or expired code. Please request a new one.');
          return;
        }
        navigation.replace('CreateNewPasswordScreen', { email, otp });
        return;
      }
      const res = await fetch(`${API_BASE_URL}/auth/verify-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? 'Invalid or expired code. Please request a new one.');
        return;
      }
      // After custom OTP verification, Supabase may not have an active session yet.
      // Ensure we are actually signed in so API calls include an Authorization token.
      if (password && email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message ?? 'Sign in failed. Please try again.');
          return;
        }
      } else {
        await supabase.auth.refreshSession();
      }
      if (role === 'provider') {
        navigation.replace('ProviderProfileScreen', { email, otp });
      } else {
        navigation.replace('EditProfileScreen', { email, otp });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendLoading) return;
    setError('');
    setResendLoading(true);
    try {
      const endpoint =
        context === 'forgot-password'
          ? `${API_BASE_URL}/auth/forgot-password`
          : `${API_BASE_URL}/auth/send-signup-otp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok && body?.error) {
        setError(body.error);
        return;
      }
      setSecondsLeft(CODE_EXPIRE_SECONDS);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TasksHeader
        isDark={isDark}
        paddingTop={insets.top}
        title="Verification"
        showBackButton
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.instruction,
            {
              color: colors.text,
              fontSize: fontSizes.body,
              fontFamily: fontFamilies.poppins,
              lineHeight: 24,
            },
          ]}
        >
          We've sent a verification code to{'\n'}
          <Text style={{ fontFamily: fontFamilies.interBold, color: colors.text, fontSize: fontSizes.body }}>
            {displayDestination}.
          </Text>
          {'\n'}Enter the code below to continue.
        </Text>

        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontSize: fontSizes.subhead,
              fontFamily: fontFamilies.interMedium,
            },
          ]}
        >
          Enter {CODE_LENGTH}-digit code
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              style={[
                styles.codeInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputFieldBg,
                  fontSize: fontSizes.title,
                  fontFamily: fontFamilies.interBold,
                },
              ]}
              value={digit}
              onChangeText={(v) => handleChange(index, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              selectionColor={colors.primary}
              cursorColor={colors.primary}
            />
          ))}
        </View>

        {error ? (
          <Text
            style={[
              styles.errorText,
              {
                color: '#dc2626',
                fontSize: fontSizes.subhead,
                fontFamily: fontFamilies.inter,
              },
            ]}
          >
            {error.trim()}
          </Text>
        ) : null}

        <View style={styles.timerRow}>
          <ClockIcon color={colors.text} width={20} height={20} />
          <Text
            style={[
              styles.timerLabel,
              {
                color: colors.text,
                fontSize: fontSizes.subhead,
                fontFamily: fontFamilies.interSemiBold,
              },
            ]}
          >
            Code expires in:{' '}
          </Text>
          <Text
            style={[
              styles.timerValue,
              {
                color: colors.primary,
                fontSize: fontSizes.subhead,
                fontFamily: fontFamilies.interMedium,
              },
            ]}
          >
            {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        <ContinueButton
          label={loading ? 'Verifying...' : 'Verify'}
          onPress={() => !loading && handleVerify()}
          isDark={isDark}
        />

        <View style={styles.resendRow}>
          <Text
            style={[
              styles.resendLabel,
              { color: colors.textSecondary, fontSize: fontSizes.subhead, fontFamily: fontFamilies.inter },
            ]}
          >
            Didn't receive the code?{' '}
          </Text>
          <Text
            onPress={resendLoading ? undefined : handleResend}
            style={[
              styles.resendLink,
              {
                color: colors.primary,
                fontSize: fontSizes.subhead,
                fontFamily: fontFamilies.interMedium,
                opacity: resendLoading ? 0.6 : 1,
              },
            ]}
          >
            {resendLoading ? 'Sending...' : 'Resend'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  instruction: { marginBottom: 24, textAlign: 'center' },
  label: { marginBottom: 12 },
  errorText: { marginTop: -15, marginBottom: 24 },
  codeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    justifyContent: 'center',
  },
  timerLabel: {},
  timerValue: {},
  codeInput: {
    width: 48,
    height: 48,
    borderRadius: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginBottom: 20,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  resendLabel: {},
  resendLink: {},
});
