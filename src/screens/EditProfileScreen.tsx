import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { getColors, palette } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import { AuthInput } from '../components/AuthInput'
import ContinueButton from '../components/ContinueButton'
import { ProfilePictureUploader } from '../components/ProfilePictureUploader'
import LocationPin from '../assets/svgs/LocationPin'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigations/RootNavigation'
import { useAuthStore } from '../../store/authStore'

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfileScreen'>

const EditProfileScreen = ({ route }: Props) => {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()
  const insets = useSafeAreaInsets()

  const { email: emailFromRoute = '', otp } = route.params ?? {}
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null)

  const handleUploadPhoto = () => {
    // TODO: integrate expo-image-picker or similar
  }
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const setUserRole = useAuthStore((s) => s.setUserRole)

  const handleCompleteProfile = () => {
    setUserRole('recipient')
    navigation.replace('MainTabs', { screen: 'Home' })
    // TODO: submit profile to API
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={{alignItems: 'center'}}>

        
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontFamily: fontFamilies.interBold,
                fontSize: fonts.largeTitle,
              },
            ]}
          >
            Complete Your Profile
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.text,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
                lineHeight: 24,
              },
            ]}
          >
            Just a few more details to get started
          </Text>
          <ProfilePictureUploader
            imageUri={profileImageUri}
            onPress={handleUploadPhoto}
          />
          </View>
         

          <View style={styles.form}>
            <AuthInput
              type="text"
              label="Full Name*"
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
            />
            <AuthInput
              type="email"
              label="Email Address"
              placeholder="yo@email.com"
              value={emailFromRoute}
              editable={false}
              placeholderTextColor={palette.timerIconColor}
              inputFieldBg={isDark ? colors.requestBtnBg : colors.inputFieldBg}
            />
            <AuthInput
              type="text"
              label="Address*"
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor={palette.timerIconColor}
              inputFieldBg={isDark ? colors.requestBtnBg : colors.inputFieldBg}
              rightIcon={
                <LocationPin
                  width={20}
                  height={20}
                  color={colors.textSecondary}
                />
              }
            />
          </View>

          <View style={styles.buttonWrap}>

            <ContinueButton
              label="Complete Profile"
              onPress={handleCompleteProfile}
              isDark={isDark}
            />
          </View>

          <Text
            style={[
              styles.disclaimer,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.caption,
              },
            ]}
          >
            All fields marked with * are required
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default EditProfileScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
   
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    marginBottom: 24,
  },
  form: {
    marginBottom: 20,
    marginTop: 15,
  },
  buttonWrap: {
    marginBottom: 16,
  },
  disclaimer: {
    textAlign: 'center',
  },
})
