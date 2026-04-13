import React, { useCallback, useRef, useState } from 'react'
import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { getColors, palette } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import { AuthInput } from '../components/AuthInput'
import ContinueButton from '../components/ContinueButton'
import { ProfilePictureUploader } from '../components/ProfilePictureUploader'
import CategoryChips from '../components/CategoryChips'
import { RecipientLocationField } from '../components/RecipientLocationField'
import { isGoogleMapsConfigured } from '../lib/googleMaps'
import ProfileFood from '../assets/svgs/ProfileFood'
import PhoneInput from 'react-native-phone-number-input'
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native'
import type { CountryCode } from 'react-native-country-picker-modal'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigations/RootNavigation'
import { useAuthStore, type Profile } from '../../store/authStore'
import { supabase } from '../lib/supabase'
import { pickImage, uploadAvatar } from '../lib/uploadAvatar'
import { fetchProfile } from '../lib/profile'
import { parseStoredPhoneForPhoneInput } from '../lib/phoneProfile'

const FOOD_CATEGORY_OPTIONS = [
  'Prepared Meals',
  'Baked Goods',
  'Fresh Produce',
  'Desserts',
  'Beverages',
  'Dairy Products',
  'Packaged Foods',
]

export default function ProviderProfileScreen() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'ProviderProfileScreen'>>()
  const { email: emailFromRoute = '', source = 'onboarding' } = route.params ?? {}
  const isSettings = source === 'settings'

  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [businessLatitude, setBusinessLatitude] = useState<number | null>(null)
  const [businessLongitude, setBusinessLongitude] = useState<number | null>(null)
  const [phone, setPhone] = useState('')
  const [phoneFormatted, setPhoneFormatted] = useState('')
  const [phoneCountryIso, setPhoneCountryIso] = useState<CountryCode>('PK')
  const [phoneInputKey, setPhoneInputKey] = useState(0)
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null)
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [displayEmail, setDisplayEmail] = useState(emailFromRoute)
  const phoneInputRef = useRef<PhoneInput>(null)

  const setProfile = useAuthStore((s) => s.setProfile)
  const profile = useAuthStore((s) => s.profile)

  const hydrateFromProfile = useCallback((p: Profile) => {
    if (p.role !== 'provider') return
    if (p.business_name) setBusinessName(p.business_name)
    else setBusinessName('')
    if (p.business_address) setBusinessAddress(p.business_address)
    else setBusinessAddress('')
    setBusinessLatitude(p.business_latitude ?? null)
    setBusinessLongitude(p.business_longitude ?? null)
    const { nationalDigits, isoRegion } = parseStoredPhoneForPhoneInput(p.phone)
    setPhoneCountryIso((isoRegion as CountryCode) || 'PK')
    setPhone(nationalDigits)
    setPhoneFormatted(p.phone?.trim() ?? '')
    setPhoneInputKey((k) => k + 1)
    if (p.categories?.length) setSelectedCategories([...p.categories])
    else setSelectedCategories([])
    if (p.avatar_url) setProfileImageUri(p.avatar_url)
  }, [])

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      ;(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const p = await fetchProfile(user.id)
        if (!p || cancelled) return
        setProfile(p)
        if (p.role === 'provider') {
          hydrateFromProfile(p)
        }
        const email =
          emailFromRoute ||
          (isSettings ? p.email : null) ||
          user.email ||
          ''
        if (!cancelled && email) setDisplayEmail(email)
      })()
      return () => {
        cancelled = true
      }
    }, [emailFromRoute, isSettings, setProfile, hydrateFromProfile])
  )

  const handleUploadPhoto = async () => {
    const result = await pickImage()
    if (result) {
      setProfileImageUri(result.uri)
      setProfileImageBase64(result.base64)
    }
  }

  const handleCompleteProfile = async () => {
    if (submitting) return
    if (!businessName.trim()) {
      setError('Business name is required.')
      return
    }
    if (!businessAddress.trim()) {
      setError('Business address is required.')
      return
    }
    if (isGoogleMapsConfigured() && (businessLatitude == null || businessLongitude == null)) {
      setError('Choose an address from the suggestions or use current location.')
      return
    }
    if (!phoneFormatted.trim() && !phone.trim()) {
      setError('Phone number is required.')
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
      const prev = useAuthStore.getState().profile
      let avatarUrl: string | null = prev?.avatar_url ?? null
      if (profileImageBase64) {
        const uploaded = await uploadAvatar(user.id, profileImageBase64)
        if (uploaded) avatarUrl = uploaded
      }
      const emailSaved = displayEmail.trim() || emailFromRoute || user.email || ''
      const updatedAt = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'provider',
          email: emailSaved,
          business_name: businessName.trim(),
          business_address: businessAddress.trim(),
          business_latitude: businessLatitude,
          business_longitude: businessLongitude,
          phone: phoneFormatted.trim() || phone.trim(),
          categories: selectedCategories,
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
        role: 'provider',
        email: emailSaved || null,
        full_name: prev?.full_name ?? null,
        avatar_url: avatarUrl,
        address: prev?.address ?? null,
        latitude: prev?.latitude ?? null,
        longitude: prev?.longitude ?? null,
        phone: phoneFormatted.trim() || phone.trim() || null,
        business_name: businessName.trim(),
        business_address: businessAddress.trim(),
        business_latitude: businessLatitude,
        business_longitude: businessLongitude,
        categories: selectedCategories,
        created_at: prev?.created_at,
        updated_at: updatedAt,
      })
      if (isSettings) {
        navigation.goBack()
      } else {
        navigation.replace('MainTabs')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
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
          <View style={styles.header}>
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
              {isSettings ? 'Edit Business Profile' : 'Complete Your Profile'}
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                  lineHeight: 24,
                },
              ]}
            >
              {isSettings
                ? 'Update how recipients see your business on NourishNet'
                : 'Help recipients find and trust your offerings'}
            </Text>
          </View>

          <ProfilePictureUploader
            imageUri={profileImageUri}
            imageCacheKey={profile?.updated_at}
            onPress={handleUploadPhoto}
            PlaceholderIcon={ProfileFood}
          />

          <View style={styles.form}>
            <AuthInput
              type="text"
              label="Business Name*"
              placeholder="Enter here"
              value={businessName}
              onChangeText={setBusinessName}
            />
            <AuthInput
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              value={displayEmail}
              placeholderTextColor={colors.requestBtnBg}
              inputFieldBg={isDark ? colors.requestBtnBg : colors.requestBtnBg}
              editable={false}
            />
            <RecipientLocationField
              address={businessAddress}
              onAddressChange={setBusinessAddress}
              onCoordinatesCleared={() => {
                setBusinessLatitude(null)
                setBusinessLongitude(null)
              }}
              onLocationResolved={({ address: next, lat, lng }) => {
                setBusinessAddress(next)
                setBusinessLatitude(lat)
                setBusinessLongitude(lng)
              }}
              hasResolvedCoordinates={businessLatitude != null && businessLongitude != null}
              fieldLabel="Business Address*"
              placeholderWhenMaps="Search for your business address"
              placeholderFallback="Enter business address"
              hintResolved="Business location saved with map coordinates."
              hintPickSuggestion="Pick a suggestion or use current location for your business."
            />
            <View style={styles.phoneField}>
              <Text
                style={[
                  styles.phoneLabel,
                  {
                    color: isDark ? palette.white : colors.text,
                    fontFamily: fontFamilies.interMedium,
                    fontSize: fonts.subhead,
                  },
                ]}
              >
                Phone #*
              </Text>
              <PhoneInput
                key={phoneInputKey}
                ref={phoneInputRef}
                defaultCode={phoneCountryIso}
                placeholder="3435234561"
                value={phone}
                onChangeText={setPhone}
                onChangeFormattedText={(text) => setPhoneFormatted(text)}
                withDarkTheme={isDark}
                containerStyle={[
                  styles.phoneInputContainer,
                  { backgroundColor: isDark ? colors.requestBtnBg : colors.inputFieldBg },
                ]}
                textContainerStyle={[
                  styles.phoneTextContainer,
                  { backgroundColor: isDark ? colors.requestBtnBg : colors.inputFieldBg },
                ]}
                textInputStyle={[
                  styles.phoneTextInput,
                  { color: isDark ? palette.white : colors.text },
                ]}
                codeTextStyle={{ color: isDark ? palette.white : colors.text }}
                flagButtonStyle={styles.phoneFlagButton}
                countryPickerButtonStyle={[
                  styles.phoneFlagButton,
                  { backgroundColor: isDark ? colors.requestBtnBg : colors.inputFieldBg },
                ]}
                textInputProps={{
                  placeholderTextColor: palette.timerIconColor,
                }}
              />
            </View>
          </View>

          <Text style={styles.categoryLabel}>
            <Text
              style={{
                color: colors.text,
                fontFamily: fontFamilies.interSemiBold,
                fontSize: fonts.body,
              }}
            >
              Food Categories{' '}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
              }}
            >
              (Select all that apply)
            </Text>
          </Text>
          <View style={styles.categoryWrap}>
            <CategoryChips
              categories={FOOD_CATEGORY_OPTIONS}
              selected={selectedCategories}
              multiSelect
              wrap
              onSelect={(cat) =>
                setSelectedCategories((prev) =>
                  prev.includes(cat)
                    ? prev.filter((c) => c !== cat)
                    : [...prev, cat]
                )
              }
            />
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: '#dc2626', fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
              {error}
            </Text>
          ) : null}
          <View style={styles.buttonWrap}>
            <ContinueButton
              label={submitting ? 'Saving...' : isSettings ? 'Save changes' : 'Complete Profile'}
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
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    // marginBottom: 20,
  },
  phoneField: {
    marginBottom: 20,
  },
  phoneLabel: {
    marginBottom: 8,
  },
  phoneInputContainer: {
    width: '100%',
    borderRadius: 12,
    minHeight: 50,
  },
  phoneTextContainer: {
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  phoneTextInput: {
    fontFamily: fontFamilies.inter,
    fontSize: 16,
    padding: 0,
  },
  phoneFlagButton: {
    borderRadius: 12,
    minWidth: 80,
  },
  categoryLabel: {
    marginBottom: 12,
  },
  categoryWrap: {
    marginBottom: 8,
  },
  buttonWrap: {
    marginTop: 24,
    marginBottom: 16,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 4,
  },
  disclaimer: {
    textAlign: 'center',
  },
})
