import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { getColors, palette } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import ContinueButton from '../components/ContinueButton'
import { AuthInput } from '../components/AuthInput'
import SplashIcon from '../assets/svgs/SplashIcon'
import AuthSeparator from '../components/AuthSeparator'
import GoogleIcon from '../assets/svgs/GoogleIcon'
import AppleIcon from '../assets/svgs/AppleIcon'
import { RootStackParamList } from '../navigations/RootNavigation'
import { API_BASE_URL } from '../lib/api/client'
import { markOnboardingComplete } from '../lib/onboardingStorage'
import { useAuthStore } from '../../store/authStore'
import { completeAuthAndGoToMainTabs } from '../lib/authSession'
import { signInWithApple, signInWithGoogle } from '../lib/oauth'
import { supabase } from '../lib/supabase'

const SignupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'SignupScreen'>>()
  const role = route.params?.role
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()
  const insets = useSafeAreaInsets() // ✅ safe area insets

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    let cancelled = false
    if (Platform.OS !== 'ios') {
      setAppleAuthAvailable(false)
      return
    }
    AppleAuthentication.isAvailableAsync().then((v) => {
      if (!cancelled) setAppleAuthAvailable(v)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSignUp = async () => {
    if (loading) return
    setEmailError('')
    setPasswordError('')
    setConfirmPasswordError('')
    setFormError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setEmailError('Please enter your email.')
      return
    }
    if (!password) {
      setPasswordError('Please enter a password.')
      return
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const effectiveRole = role ?? 'recipient'
      
      // Recipients skip OTP verification
      if (effectiveRole === 'recipient') {
        console.log('[SignupScreen] Signing up recipient:', trimmedEmail)
        const res = await fetch(`${API_BASE_URL}/auth/signup-recipient`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password }),
        })
        console.log('[SignupScreen] Response status:', res.status)
        const body = await res.json().catch((e) => {
          console.error('[SignupScreen] Failed to parse response:', e)
          return {}
        })
        console.log('[SignupScreen] Response body:', body)
        if (!res.ok) {
          setFormError(body?.error ?? 'Sign up failed. Please try again.')
          return
        }
        
        // Sign in the newly created user
        console.log('[SignupScreen] Signing in user...')
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: trimmedEmail, 
          password 
        })
        if (signInError) {
          console.error('[SignupScreen] Sign in error:', signInError)
          setFormError(signInError.message ?? 'Sign in failed. Please try again.')
          return
        }
        
        // Wait a moment for the database to update
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Fetch the profile to get the anonymous username
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            const profileObj = {
              id: profileData.id,
              role: profileData.role,
              email: profileData.email,
              full_name: profileData.full_name,
              avatar_url: profileData.avatar_url,
              address: profileData.address,
              latitude: profileData.latitude,
              longitude: profileData.longitude,
              phone: profileData.phone,
              business_name: profileData.business_name,
              business_address: profileData.business_address,
              business_latitude: profileData.business_latitude,
              business_longitude: profileData.business_longitude,
              categories: profileData.categories || [],
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
            }
            setAuth(profileData.role, profileObj)
          }
        }
        
        console.log('[SignupScreen] Sign in successful, navigating to profile...')
        await markOnboardingComplete()
        navigation.reset({
          index: 0,
          routes: [{ name: 'EditProfileScreen', params: { email: trimmedEmail } }],
        })
      } else {
        // Providers go through OTP verification
        console.log('[SignupScreen] Signing up provider:', trimmedEmail)
        const res = await fetch(`${API_BASE_URL}/auth/start-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, role: effectiveRole }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          setFormError(body?.error ?? 'Sign up failed. Please try again.')
          return
        }
        await markOnboardingComplete()
        navigation.navigate('VerificationCodeScreen', {
          email: trimmedEmail,
          context: 'signup',
          password,
          role: effectiveRole,
        })
      }
    } catch (error) {
      console.error('[SignupScreen] Unexpected error:', error)
      setFormError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const runOAuth = async (provider: 'google' | 'apple') => {
    if (oauthLoading) return
    setFormError('')
    setOauthLoading(provider)
    try {
      const { data, error } =
        provider === 'google' ? await signInWithGoogle() : await signInWithApple()
      if (error) {
        setFormError(error.message ?? 'Sign up failed. Please try again.')
        return
      }
      if (!data) return
      const result = await completeAuthAndGoToMainTabs(navigation, role, setAuth, {
        flow: 'signup',
      })
      if (result.ok === false) {
        setFormError(result.message)
      }
    } finally {
      setOauthLoading(null)
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
          <SplashIcon width={66} height={62} style={styles.logo} />

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontFamily: fontFamilies.poppinsBold,
                fontSize: fonts.largeTitle,
              },
            ]}
          >
            Create Account
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
            Join NourishNet today
          </Text>
<View style={{marginTop:24}}>


          <AuthInput
            type="email"
            value={email}
            onChangeText={(v) => {
              setEmail(v)
              if (emailError) setEmailError('')
              if (formError) setFormError('')
            }}
            placeholder="abc@gmail.com"
          />
          {emailError ? (
            <Text
              style={[
                styles.fieldErrorText,
                {
                  color: '#dc2626',
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {emailError}
            </Text>
          ) : null}

          <AuthInput
            type="password"
            label="Password"
            value={password}
            onChangeText={(v) => {
              setPassword(v)
              if (passwordError) setPasswordError('')
              if (formError) setFormError('')
            }}
            showPasswordToggle
          />
          {passwordError ? (
            <Text
              style={[
                styles.fieldErrorText,
                {
                  color: '#dc2626',
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {passwordError}
            </Text>
          ) : null}

          <AuthInput
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v)
              if (confirmPasswordError) setConfirmPasswordError('')
              if (formError) setFormError('')
            }}
            showPasswordToggle
          />
          {confirmPasswordError ? (
            <Text
              style={[
                styles.fieldErrorText,
                {
                  color: '#dc2626',
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {confirmPasswordError}
            </Text>
          ) : null}
</View>
          {formError ? (
            <Text
              style={[
                styles.errorText,
                {
                  color: '#dc2626',
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {formError}
            </Text>
          ) : null}
          <View style={styles.signUpBtn}>
            <ContinueButton
              label={loading ? 'Signing up...' : 'Sign up'}
              onPress={handleSignUp}
              isDark={isDark}
            />
          </View>

          <View style={styles.separator}>
            <AuthSeparator label="Or continue with" />
          </View>

          <View style={styles.socialRow}>
            <ContinueButton
              label={oauthLoading === 'google' ? 'Signing in…' : ' Google'}
              onPress={() => runOAuth('google')}
              icon={<GoogleIcon width={18} height={18} />}
              backgroundColor={colors.background}
              borderColor={colors.borderColor}
              textColor={colors.text}
              style={styles.socialBtn}
              disabled={!!oauthLoading}
            />
            {Platform.OS === 'ios' && appleAuthAvailable ? (
              <ContinueButton
                label={oauthLoading === 'apple' ? 'Signing in…' : '  Apple'}
                onPress={() => runOAuth('apple')}
                icon={<AppleIcon width={18} height={18} color={colors.text} />}
                backgroundColor={colors.background}
                borderColor={colors.borderColor}
                textColor={colors.text}
                style={styles.socialBtn}
                disabled={!!oauthLoading}
              />
            ) : null}
          </View>

          <View style={styles.footerRow}>
            <Text
              style={{
                color: colors.text,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
              }}
            >
              Already have an account{' '}
            </Text>
            <TouchableOpacity
              onPress={() =>
                role
                  ? navigation.navigate('LoginScreen', { role })
                  : navigation.navigate('LoginScreen')
              }
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: fontFamilies.interMedium,
                  fontSize: fonts.subhead,
                }}
              >
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default SignupScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    
  },
  content: {
 
    paddingHorizontal: 16,
    marginTop:10

  },
  logo: {
    alignSelf: 'center',
  
  },
  title: {
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 6,
  },
  signUpBtn: {
    marginTop: 25,
  },
  separator: {
    marginTop: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
  },
  fieldErrorText: {
    marginTop: -14,
    marginBottom: 8,
  },
})
