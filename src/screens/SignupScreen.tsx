import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState } from 'react'
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

  const handleSignUp = () => {
    navigation.navigate('VerificationCodeScreen', {
      email: email || undefined,
      ...(role && { role }),
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
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
            onChangeText={setEmail}
            placeholder="abc@gmail.com"
          />

          <AuthInput
            type="password"
            label="Password"
            value={password}
            onChangeText={setPassword}
            showPasswordToggle
          />

          <AuthInput
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showPasswordToggle
          />
</View>
          <View style={styles.signUpBtn}>
            <ContinueButton
              label="Sign up"
              onPress={handleSignUp}
              isDark={isDark}
            />
          </View>

          <View style={styles.separator}>
            <AuthSeparator label="Or continue with" />
          </View>

          <View style={styles.socialRow}>
            <ContinueButton
              label=" Google"
              onPress={() => {}}
              icon={<GoogleIcon width={18} height={18} />}
              backgroundColor={colors.background}
              borderColor={colors.borderColor}
              textColor={colors.text}
              style={styles.socialBtn}
            />
            <ContinueButton
              label="  Apple"
              onPress={() => {}}
              icon={<AppleIcon width={18} height={18} color={colors.text} />}
              backgroundColor={colors.background}
              borderColor={colors.borderColor}
              textColor={colors.text}
              style={styles.socialBtn}
            />
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
                navigation.navigate('LoginScreen', role ? { role } : undefined)
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
    </View>
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
})
