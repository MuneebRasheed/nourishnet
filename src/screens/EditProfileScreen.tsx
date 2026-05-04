import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { getColors } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import { AuthInput } from '../components/AuthInput'
import ContinueButton from '../components/ContinueButton'
import { ProfilePictureUploader } from '../components/ProfilePictureUploader'
import { RecipientLocationField } from '../components/RecipientLocationField'
import { isGoogleMapsConfigured } from '../lib/googleMaps'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigations/RootNavigation'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../lib/supabase'
import { pickImage, uploadAvatar } from '../lib/uploadAvatar'
import { fetchProfile } from '../lib/profile'
import ArrowBACK from '../assets/svgs/ArrowBACK'

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfileScreen'>

const EditProfileScreen = ({ route }: Props) => {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()
  const insets = useSafeAreaInsets()

  const { email: emailFromRoute = '' } = route.params ?? {}
  const profile = useAuthStore((s) => s.profile)
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null)
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const setProfile = useAuthStore((s) => s.setProfile)

  useEffect(() => {
    const load = async (p: typeof profile) => {
      if (p && p.role === 'recipient') {
        if (p.full_name) setFullName(p.full_name)
        if (p.address) setAddress(p.address)
        setLatitude(p.latitude ?? null)
        setLongitude(p.longitude ?? null)
        if (p.avatar_url) setProfileImageUri(p.avatar_url)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !p) {
        const fetched = await fetchProfile(user.id)
        if (fetched && fetched.role === 'recipient') {
          setProfile(fetched)
          if (fetched.full_name) setFullName(fetched.full_name)
          if (fetched.address) setAddress(fetched.address)
          setLatitude(fetched.latitude ?? null)
          setLongitude(fetched.longitude ?? null)
          if (fetched.avatar_url) setProfileImageUri(fetched.avatar_url)
        }
      }
    }
    load(profile)
  }, [profile?.id])

  const handleUploadPhoto = async () => {
    const result = await pickImage()
    if (result) {
      setProfileImageUri(result.uri)
      setProfileImageBase64(result.base64)
    }
  }

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack()
  }

  const handleCompleteProfile = async () => {
    if (submitting) return
    // Full name is optional for recipients
    if (!address.trim()) {
      setError('Address is required.')
      return
    }
    if (isGoogleMapsConfigured() && (latitude == null || longitude == null)) {
      setError('Choose an address from the suggestions or use current location.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be signed in to complete your profile.')
        return
      }
      let avatarUrl: string | null = profile?.avatar_url ?? null
      if (profileImageBase64) {
        const uploaded = await uploadAvatar(user.id, profileImageBase64)
        if (uploaded) avatarUrl = uploaded
      }
      const emailValue = emailFromRoute || profile?.email || user.email || ''
      const updatedAt = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'recipient',
          email: emailValue,
          full_name: fullName.trim(),
          address: address.trim(),
          latitude,
          longitude,
          avatar_url: avatarUrl,
          updated_at: updatedAt,
        })
        .eq('id', user.id)
      if (updateError) {
        setError(updateError.message ?? 'Failed to save profile.')
        return
      }
      setProfile({
        id: user.id,
        role: 'recipient',
        email: emailValue || null,
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        address: address.trim(),
        latitude,
        longitude,
        phone: null,
        business_name: profile?.business_name ?? null,
        business_address: profile?.business_address ?? null,
        business_latitude: profile?.business_latitude ?? null,
        business_longitude: profile?.business_longitude ?? null,
        categories: profile?.categories ?? [],
        created_at: profile?.created_at,
        updated_at: updatedAt,
      })
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.8}
            style={[styles.backBtn, { backgroundColor: colors.inputFieldBg }]}
          >
            <ArrowBACK width={22} height={22} color={colors.text} />
          </TouchableOpacity>
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
            imageCacheKey={profile?.updated_at}
            onPress={handleUploadPhoto}
          />
          </View>

          <View style={styles.form}>
            <AuthInput
              type="text"
              label="Full Name"
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
            />
            <AuthInput
              type="email"
              label="Email Address"
              placeholder="yo@email.com"
              value={(emailFromRoute || profile?.email) ?? ''}
              editable={false}
              placeholderTextColor={colors.textSecondary}
              inputFieldBg={isDark ? colors.requestBtnBg : colors.inputFieldBg}
              style={{ color: colors.textSecondary }}
            />
            <RecipientLocationField
              address={address}
              onAddressChange={setAddress}
              onCoordinatesCleared={() => {
                setLatitude(null)
                setLongitude(null)
              }}
              onLocationResolved={({ address: next, lat, lng }) => {
                setAddress(next)
                setLatitude(lat)
                setLongitude(lng)
              }}
              hasResolvedCoordinates={latitude != null && longitude != null}
            />
          </View>

          {error && error !== 'Full name is required.' ? (
            <Text style={[styles.errorText, { color: '#dc2626', fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
              {error}
            </Text>
          ) : null}
          <View style={styles.buttonWrap}>
            <ContinueButton
              label={submitting ? 'Saving...' : 'Complete Profile'}
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
            Fields marked with * are required
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default EditProfileScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
  errorText: {
    marginTop: -30,
    marginBottom: 20,
  },
  fieldErrorText: {
    marginTop: -15,
    marginBottom: 8,
  },
  buttonWrap: {
    marginBottom: 16,
  },
  disclaimer: {
    textAlign: 'center',
  },
})
