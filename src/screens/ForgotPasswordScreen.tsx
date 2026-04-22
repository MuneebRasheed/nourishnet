import { StyleSheet, Text, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { getColors, palette } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import ContinueButton from '../components/ContinueButton'
import { AuthInput } from '../components/AuthInput'
import { RootStackParamList } from '../navigations/RootNavigation'
import { API_BASE_URL } from '../lib/api/client'

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const insets = useSafeAreaInsets()
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email to reset password.')
      return
    }
    if (loading) return
    setError('')
    setLoading(true)
    try {
      await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      navigation.navigate('VerificationCodeScreen', {
        email: trimmedEmail,
        context: 'forgot-password',
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontFamily: fontFamilies.interSemiBold,
              fontSize: fonts.largeTitle,
            },
          ]}
        >
          Forgot Password?
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              fontFamily: fontFamilies.inter,
              fontSize: fonts.body,
            },
          ]}
        >
          Enter your email and we'll send you a code to reset your password.
        </Text>

        <View style={styles.inputWrap}>
          <AuthInput type="email" value={email} onChangeText={setEmail} />
        </View>

        {error ? (
          <Text
            style={[
              styles.errorText,
              {
                color: palette.logoutColor,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
              },
            ]}
          >
            {error}
          </Text>
        ) : null}

        <View style={styles.buttonWrap}>
          <ContinueButton
            label={loading ? 'Sending code...' : 'Send reset code'}
            onPress={handleSubmit}
            isDark={isDark}
          />
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: fontFamilies.interMedium,
              fontSize: fonts.subhead,
            }}
          >
            Back to sign in
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ForgotPasswordScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  inputWrap: {
    // marginBottom: 8,
  },
  errorText: {
    marginTop: -10,
    // textAlign: 'center',
  },
  buttonWrap: {
    marginTop: 24,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 24,
  },
})
