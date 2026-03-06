import { StyleSheet, Text, View, TouchableOpacity, Pressable } from 'react-native'
import React, { useState } from 'react'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
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
import { supabase } from '../lib/supabase'
import { API_BASE_URL } from '../lib/api/client'
import { useAuthStore } from '../../store/authStore'
import { fetchProfile } from '../lib/profile'

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'LoginScreen'>>()
  const role = route.params?.role
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()

  const [mode, setMode] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [error, setError] = useState('')
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email to reset password.')
      return
    }
    if (forgotLoading) return
    setError('')
    setForgotLoading(true)
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
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (loading) return
    setError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })
      if (signInError) {
        setError(signInError.message ?? 'Sign in failed. Please try again.')
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const profile = await fetchProfile(user.id)
        setAuth(profile?.role ?? null, profile ?? null)
      }
      navigation.replace('MainTabs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
      <SplashIcon width={66} height={62} style={{alignSelf:"center",marginTop:20}} />

        <Text
          style={[
            styles.welcomeText,
            {
              color: colors.text,
              fontFamily: fontFamilies.poppinsSemiBold,
              fontSize: fonts.largeTitle,
              textAlign: 'center',
            },
          ]}
        >
          Welcome Back
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: fontFamilies.poppins,
            fontSize: fonts.body,
            textAlign: 'center',
            
          }}
        >
        Sign in to your account
        </Text>

         {/* {/ Email / Phone tab selection - commented to show only email + password */}
        {/* <View style={[styles.tabs, { backgroundColor: colors.inputFieldBg }]}> 
          {(['email', 'phone'] as const).map((t) => {
            const active = t === mode
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setMode(t)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? colors.primary : 'transparent',
                  },
                ]}
                activeOpacity={0.9}
              >
                <Text
                  style={{
                    color: active ? palette.white : colors.textSecondary,
                    fontFamily: fontFamilies.interBold,
                    fontSize: fonts.body,
                   
                  }}
                >
                  {t === 'email' ? 'Email' : 'Phone Number'}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {mode === 'email' ? (
          <AuthInput type="email" value={email} onChangeText={setEmail} />
        ) : (
          <AuthInput
            type="text"
            label="Phone Number"
            placeholder="(555) 000-0000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        )}
         */}
        <View style={{marginTop:24}}>

        
        <AuthInput type="email" value={email} onChangeText={setEmail} />

      

        <AuthInput
          type="password"
          value={password}
          onChangeText={setPassword}
          showPasswordToggle
        />
        </View>
        {error ? (
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
            {error}
          </Text>
        ) : null}
        <Pressable
          style={{ marginTop: error ? 4 : -8 }}
          onPress={handleForgotPassword}
        >
          <Text style={{ color: colors.primary, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }}>
            {forgotLoading ? 'Sending code...' : 'Forgot Password?'}
          </Text>
        </Pressable>

       
<View style={{marginTop:30}}>
<ContinueButton
          label={loading ? 'Signing in...' : 'Sign In'}
          onPress={handleSignIn}
          isDark={isDark}
        />
</View>
        

        <View style={styles.separator}>
         <AuthSeparator label="Or continue with"/>
        </View>

        <View style={styles.socialRow}>
          <ContinueButton
            label=" Google"
            onPress={() => {}}
            icon={<GoogleIcon width={18} height={18}  />}
            backgroundColor={colors.inputFieldBg}
            
            textColor={colors.text}
            style={styles.socialBtn}
              
            
          />
          <ContinueButton
            label="  Apple"
            onPress={() => {}}
            icon={<AppleIcon width={18} height={18} color={colors.text} />}
            backgroundColor={colors.inputFieldBg}
            
            textColor={colors.text}
             style={styles.socialBtn}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={{ 
            color: colors.text, 
            fontFamily: fontFamilies.inter, 
            fontSize: fonts.subhead 
            }}>
            Don’t have an account?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignupScreen', role ? { role } : undefined)}
            activeOpacity={0.8}
          >
            <Text style={{ 
              color: colors.primary,
               fontFamily: fontFamilies.interMedium, 
               fontSize: fonts.subhead, marginLeft: 2
               }}>
              Sign up
            </Text>
          </TouchableOpacity>
       
     
        </View>
        
      </View>
    </View>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingHorizontal: 16,
  
  },

  tabs: {
    flexDirection: 'row',
    padding: 4,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 200,
  
    alignItems: 'center',
    justifyContent: 'center',
   
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 200,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:20
    
  },
  sepLine: {
    height: 1,
    flex: 1,
  },
  socialRow: {
    flexDirection: 'row',
  justifyContent:"center",
    marginTop:20,
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  socialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  socialIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  welcomeText:{
    marginTop:20
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
  },
})
