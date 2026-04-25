import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import ContinueButton from '../components/ContinueButton';
import { AuthInput } from '../components/AuthInput';
import ConfirmationCheckbox from '../components/ConfirmationCheckbox';
import CustomSwitch from '../components/CustomSwitch';
import ArrowBACK from '../assets/svgs/ArrowBACK';
import ArrowDown from '../assets/svgs/ArrowDown';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';
import { useProviderListingsStore, type ProviderListing } from '../../store/providerListingsStore';
import { useAuthStore } from '../../store/authStore';
import {
  createListingApi,
  updateListingApi,
  finalizeZeroQuantityListingsOnServer,
  listingHasZeroQuantity,
  resolveTotalQuantityForSave,
} from '../lib/api/listings';
import { supabase } from '../lib/supabase';
import { uploadListingImage } from '../lib/uploadListingImage';
import {
  fetchPlacePredictions,
  isGoogleMapsConfigured,
  type PlacePrediction,
} from '../lib/googleMaps';
import { canCreatePost } from '../lib/subscriptionLimits';
import { useOfferingsStore } from '../../store/offeringsStore';

function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Parse "4:00 PM" / "11:30 AM" style string to Date (today with that time). */
function parseTimeStringToDate(s: string): Date | null {
  if (!s || typeof s !== 'string') return null;
  const trimmed = s.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

type GapUnit = 'minutes' | 'seconds';

const SAFETY_ITEMS = [
  'I confirm this food was handled safely and in accordance with local health and food safety regulations.',
  'This food is within local food donation guidelines applicable to my jurisdiction.',
  'This food is NOT home-prepared, unless explicitly permitted by local law in my region.',
  'I have accurately declared all known allergens present in this food.',
];

export default function PostPublishScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostPublishScreen'>>();
  const editListing = route.params?.editListing;
  const repostSourceListing = route.params?.repostSourceListing;
  const profile = useAuthStore((s) => s.profile);
  const defaultPickupFromBusinessProfile = profile?.business_address?.trim() ?? '';
  const addListingFromApi = useProviderListingsStore((s) => s.addListingFromApi);
  const customerInfo = useOfferingsStore((s) => s.customerInfo);
  const [publishing, setPublishing] = useState(false);

  const getDefaultStart = () => {
    const d = new Date();
    d.setHours(6, 0, 0, 0);
    return d;
  };
  const getDefaultEnd = () => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  };

  const [pickupAddress, setPickupAddress] = useState(
    () =>
      editListing?.pickupAddress?.trim() ??
      repostSourceListing?.pickupAddress?.trim() ??
      defaultPickupFromBusinessProfile
  );
  const [pickupStart, setPickupStart] = useState<Date | null>(() =>
    editListing?.startTime
      ? parseTimeStringToDate(editListing.startTime)
      : repostSourceListing?.startTime
        ? parseTimeStringToDate(repostSourceListing.startTime)
        : null
  );
  const [pickupEnd, setPickupEnd] = useState<Date | null>(() =>
    editListing?.endTime
      ? parseTimeStringToDate(editListing.endTime)
      : repostSourceListing?.endTime
        ? parseTimeStringToDate(repostSourceListing.endTime)
        : null
  );
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end' | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [note, setNote] = useState(editListing?.note ?? repostSourceListing?.note ?? '');
  const [confirmations, setConfirmations] = useState<boolean[]>([false, false, false, false]);
  const [addressPredictions, setAddressPredictions] = useState<PlacePrediction[]>([]);
  const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAddressFetchRef = useRef(false);

  const [gapStaggerEnabled, setGapStaggerEnabled] = useState(false);
  const [gapAmount, setGapAmount] = useState('2');
  const [gapUnit, setGapUnit] = useState<GapUnit>('minutes');
  const [showGapUnitDropdown, setShowGapUnitDropdown] = useState(false);

  const applyPickupAndGapFromListing = (listing: ProviderListing) => {
    setPickupAddress(listing.pickupAddress?.trim() ?? '');
    setPickupStart(listing.startTime ? parseTimeStringToDate(listing.startTime) : null);
    setPickupEnd(listing.endTime ? parseTimeStringToDate(listing.endTime) : null);
    setNote(listing.note ?? '');
    const pg = listing.preferenceGapSeconds;
    if (pg != null && pg >= 1 && pg <= 300) {
      setGapStaggerEnabled(true);
      if (pg % 60 === 0 && pg / 60 >= 1 && pg / 60 <= 5) {
        setGapUnit('minutes');
        setGapAmount(String(pg / 60));
      } else {
        setGapUnit('seconds');
        setGapAmount(String(pg));
      }
    } else {
      setGapStaggerEnabled(false);
      setGapAmount('2');
      setGapUnit('minutes');
    }
  };

  useEffect(() => {
    if (editListing) {
      applyPickupAndGapFromListing(editListing);
    } else if (repostSourceListing) {
      applyPickupAndGapFromListing(repostSourceListing);
    } else {
      setPickupAddress(profile?.business_address?.trim() ?? '');
      setPickupStart(null);
      setPickupEnd(null);
      setNote('');
      setGapStaggerEnabled(false);
      setGapAmount('2');
      setGapUnit('minutes');
    }
    setShowAddressSuggestions(false);
    setAddressPredictions([]);
    setLoadingAddressSuggestions(false);
    setShowGapUnitDropdown(false);
  }, [editListing, repostSourceListing, profile?.business_address]);

  useEffect(() => {
    if (!isGoogleMapsConfigured()) return;
    if (!showAddressSuggestions) {
      setAddressPredictions([]);
      setLoadingAddressSuggestions(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    if (skipNextAddressFetchRef.current) {
      skipNextAddressFetchRef.current = false;
      return;
    }
    const q = pickupAddress.trim();
    if (q.length < 2) {
      setAddressPredictions([]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingAddressSuggestions(true);
      try {
        const list = await fetchPlacePredictions(q);
        setAddressPredictions(list.slice(0, 6));
      } finally {
        setLoadingAddressSuggestions(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pickupAddress, showAddressSuggestions]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const openStartTimePicker = () => {
    if (pickupStart === null) setPickupStart(getDefaultStart());
    setTimePickerMode('start');
    setShowEndPicker(false);
    setShowStartPicker(true);
    setShowTimePickerModal(true);
  };

  const openEndTimePicker = () => {
    if (pickupEnd === null) setPickupEnd(getDefaultEnd());
    setTimePickerMode('end');
    setShowStartPicker(false);
    setShowEndPicker(true);
    setShowTimePickerModal(true);
  };

  const closeTimePickerModal = () => {
    setShowTimePickerModal(false);
    setTimePickerMode(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleStartTimeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (date) setPickupStart(date);
  };

  const handleEndTimeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (date) setPickupEnd(date);
  };

  const arrowColor = isDark ? colors.textSecondary : colors.text;

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const toggleConfirmation = (index: number) => {
    setConfirmations((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const allConfirmed = confirmations.every(Boolean);

  /** Returns seconds 1–300, or null if stagger off. Sets alerts and returns undefined on invalid. */
  const resolvePreferenceGapSeconds = (): number | null | undefined => {
    if (!gapStaggerEnabled) return null;
    const raw = gapAmount.trim();
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) {
      Alert.alert('Invalid gap', 'Enter a whole number of at least 1.');
      return undefined;
    }
    if (gapUnit === 'minutes') {
      if (n > 5) {
        Alert.alert('Invalid gap', 'Maximum is 5 minutes.');
        return undefined;
      }
      const seconds = n * 60;
      if (seconds < 1 || seconds > 300) {
        Alert.alert('Invalid gap', 'Maximum gap is 5 minutes (300 seconds).');
        return undefined;
      }
      return seconds;
    }
    if (n > 300) {
      Alert.alert('Invalid gap', 'Maximum is 300 seconds (5 minutes).');
      return undefined;
    }
    return n;
  };

  const handlePublish = async () => {
    const draft = route.params?.draft;
    if (!draft) return;

    const trimmedAddress = pickupAddress.trim();
    const hasStartTime = Boolean(pickupStart);
    const hasEndTime = Boolean(pickupEnd);

    if (!trimmedAddress) {
      Alert.alert('Missing required field', 'Please enter the pickup address.');
      return;
    }
    if (!hasStartTime || !hasEndTime) {
      Alert.alert('Missing required field', 'Please select both start and end pickup times.');
      return;
    }
    if (!allConfirmed) {
      Alert.alert(
        'Food safety confirmation required',
        'Please confirm all food safety items before publishing.'
      );
      return;
    }

    const preferenceGapSeconds = resolvePreferenceGapSeconds();
    if (preferenceGapSeconds === undefined) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Sign in required', 'Please sign in again to publish or edit listings.');
      navigation.replace('LoginScreen');
      return;
    }

    // Check monthly post limit for free plan users (only for new posts, not edits)
    if (!editListing) {
      const limitCheck = await canCreatePost(session.user.id, customerInfo);
      
      if (limitCheck.error) {
        Alert.alert('Error', 'Unable to verify post limit. Please try again.');
        return;
      }
      
      if (!limitCheck.allowed) {
        Alert.alert(
          'Monthly Limit Reached',
          `You've reached your monthly limit of ${limitCheck.limit} posts on the Free plan. You've created ${limitCheck.currentCount} posts this month.\n\nUpgrade to Pro for unlimited posts and more features!`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade to Pro',
              onPress: () => {
                navigation.navigate('SubscriptionManagementScreen');
              },
            },
          ]
        );
        return;
      }
    }

    const totalQuantity = resolveTotalQuantityForSave(draft.quantity, editListing);

    const payload = {
      title: draft.foodTitle || 'Food name',
      foodType: draft.foodType,
      quantity: draft.quantity,
      totalQuantity,
      quantityUnit: draft.quantityUnit,
      dietaryTags: draft.dietarySelected,
      allergens: draft.allergensSelected,
      imageUrl: draft.foodImageUri ?? null,
      pickupAddress,
      startTime: pickupStart ? formatTimeForDisplay(pickupStart) : '6:00 AM',
      endTime: pickupEnd ? formatTimeForDisplay(pickupEnd) : '6:00 PM',
      note,
      preferenceGapSeconds,
    };

    setPublishing(true);
    try {
      const persistListingInStore = async (listing: ProviderListing) => {
        const open =
          listing.status === 'active' ||
          listing.status === 'request_open' ||
          listing.status === 'claimed';
        if (open && listingHasZeroQuantity(listing)) {
          const [next] = await finalizeZeroQuantityListingsOnServer([listing]);
          addListingFromApi(next);
        } else {
          addListingFromApi(listing);
        }
      };

      const hasNewImage = Boolean(draft.foodImageUri && draft.foodImageBase64);
      if (hasNewImage && draft.foodImageBase64) {
        const uploaded = await uploadListingImage(
          session.user.id,
          draft.foodImageBase64,
          editListing?.id,
          draft.foodImageMimeType ?? 'image/jpeg'
        );
        if (!uploaded) {
          Alert.alert('Image upload failed', 'Unable to upload image. Please try again.');
          return;
        }
        payload.imageUrl = uploaded;
      }

      if (editListing) {
        const { listing, error } = await updateListingApi(editListing.id, payload);
        if (error || !listing) {
          Alert.alert('Error', error ?? 'Failed to update listing. Please try again.');
          return;
        }
        await persistListingInStore(listing);
      } else {
        const { listing, error } = await createListingApi(payload);
        if (error || !listing) {
          Alert.alert('Error', error ?? 'Failed to publish. Please try again.');
          return;
        }
        await persistListingInStore(listing);
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
      });
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSelectAddressPrediction = (prediction: PlacePrediction) => {
    Keyboard.dismiss();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    skipNextAddressFetchRef.current = true;
    setShowAddressSuggestions(false);
    setAddressPredictions([]);
    setLoadingAddressSuggestions(false);
    setPickupAddress(prediction.description);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <View style={{ paddingTop: insets.top }}>
        <SettingsHeader
          title={editListing ? 'Edit Food' : 'Post Food'}
          onLeftPress={handleBack}
          leftIcon={<ArrowBACK width={32} height={32} color={colors.text} />}
          titleAlign="left"
          showBorder={false}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        {/* Pickup Details */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
          ]}
        >
          Pickup Details
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
          ]}
        >
          When and where can recipients collect the food?
        </Text>

        <View style={styles.fieldGroup}>
          <AuthInput
            type="text"
            label="Pickup Address*"
            placeholder={
              isGoogleMapsConfigured() ? 'Search pickup address' : 'Enter pickup address'
            }
            value={pickupAddress}
            onChangeText={(value) => {
              setShowAddressSuggestions(true);
              setPickupAddress(value);
            }}
            onFocus={() => {
              setAddressPredictions([]);
              setLoadingAddressSuggestions(false);
            }}
            onBlur={() => {
              setShowAddressSuggestions(false);
              setAddressPredictions([]);
              setLoadingAddressSuggestions(false);
            }}
            leftIcon={<LocationPin width={20} height={20} color={colors.text} />}
            containerStyle={styles.authInputContainer}
          />
          {showAddressSuggestions && loadingAddressSuggestions ? (
            <View style={styles.addressLoadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[
                  styles.addressLoadingText,
                  {
                    color: colors.textSecondary,
                    fontFamily: fontFamilies.inter,
                    fontSize: fonts.caption,
                  },
                ]}
              >
                Looking up addresses...
              </Text>
            </View>
          ) : null}
          {showAddressSuggestions && addressPredictions.length > 0 ? (
            <View
              style={[
                styles.addressSuggestions,
                {
                  backgroundColor: colors.inputFieldBg,
                  borderColor: colors.borderColor,
                },
              ]}
            >
              {addressPredictions.map((prediction) => (
                <Pressable
                  key={prediction.place_id}
                  onPress={() => handleSelectAddressPrediction(prediction)}
                  style={({ pressed }) => [
                    styles.addressSuggestionRow,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <LocationPin width={16} height={16} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.addressSuggestionText,
                      {
                        color: colors.text,
                        fontFamily: fontFamilies.inter,
                        fontSize: fonts.caption,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {prediction.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.timeFieldsRow}>
            <View style={styles.timeFieldHalf}>
              <Text style={[styles.timeFieldLabel, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                Start Time*
              </Text>
              <TouchableOpacity
                style={[styles.timeFieldCard, { backgroundColor: colors.inputFieldBg }]}
                activeOpacity={0.8}
                onPress={openStartTimePicker}
              >
                <LocationPin width={20} height={20} color={colors.text} />
                <View style={styles.timeFieldValueWrap}>
                  <Text
                    style={[
                      styles.timeFieldValue,
                      { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.subhead },
                    ]}
                  >
                    {pickupStart ? formatTimeForDisplay(pickupStart) : 'Select'}
                  </Text>
                </View>
                <ArrowDown width={20} height={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.timeFieldHalf}>
              <Text style={[styles.timeFieldLabel, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                End Time*
              </Text>
              <TouchableOpacity
                style={[styles.timeFieldCard, { backgroundColor: colors.inputFieldBg }]}
                activeOpacity={0.8}
                onPress={openEndTimePicker}
              >
                <ClockICon width={20} height={20} color={colors.text} />
                <View style={styles.timeFieldValueWrap}>
                  <Text
                    style={[
                      styles.timeFieldValue,
                      { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.subhead },
                    ]}
                  >
                    {pickupEnd ? formatTimeForDisplay(pickupEnd) : 'Select'}
                  </Text>
                </View>
                <ArrowDown width={20} height={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <Modal
            visible={showTimePickerModal}
            transparent
            animationType="slide"
            onRequestClose={closeTimePickerModal}
          >
            <TouchableOpacity
              style={styles.timePickerOverlay}
              activeOpacity={1}
              onPress={closeTimePickerModal}
            >
              <View
                style={[styles.timePickerModal, { backgroundColor: colors.background }]}
                onStartShouldSetResponder={() => true}
              >
                <Text
                  style={[
                    styles.timePickerModalTitle,
                    { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
                  ]}
                >
                  {timePickerMode === 'start' ? 'Start Time' : 'End Time'}
                </Text>
                {timePickerMode === 'start' && Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={pickupStart ?? getDefaultStart()}
                    mode="time"
                    display="spinner"
                    themeVariant={isDark ? 'dark' : 'light'}
                    onChange={handleStartTimeChange}
                  />
                )}
                {timePickerMode === 'end' && Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={pickupEnd ?? getDefaultEnd()}
                    mode="time"
                    display="spinner"
                    themeVariant={isDark ? 'dark' : 'light'}
                    onChange={handleEndTimeChange}
                  />
                )}
                <ContinueButton
                  label="Done"
                  onPress={closeTimePickerModal}
                  isDark={isDark}
                  style={styles.timePickerDoneBtn}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {showStartPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickupStart ?? getDefaultStart()}
              mode="time"
              display="default"
              onChange={handleStartTimeChange}
            />
          )}
          {showEndPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickupEnd ?? getDefaultEnd()}
              mode="time"
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead, marginBottom: 8 }]}>
            Note
          </Text>
          <TextInput
            style={[
              styles.noteInput,
              { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor, color: colors.text },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="e.g., Ring the doorbell, Ask for John, etc."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Preference gap (stagger visibility) */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
          ]}
        >
          Visibility timing
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            {
              color: colors.textSecondary,
              fontFamily: fontFamilies.inter,
              fontSize: fonts.caption,
              lineHeight: 20,
            },
          ]}
        >
          Optional: high-need recipients can be notified first; everyone else sees the listing after
          this gap (max 5 minutes). General rollout uses this delay.
        </Text>
        <View
          style={[
            styles.gapCard,
            { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor },
            !isDark && { borderWidth: 1 },
          ]}
        >
          <View style={styles.gapSwitchRow}>
            <View style={styles.gapSwitchLabelWrap}>
              <Text
                style={[
                  styles.gapSwitchTitle,
                  { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead },
                ]}
              >
                Stagger general visibility
              </Text>
              <Text
                style={[
                  styles.gapSwitchHint,
                  { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
                ]}
              >
                Preference gap before all nearby recipients see this post
              </Text>
            </View>
            <CustomSwitch
              value={gapStaggerEnabled}
              onValueChange={(v) => {
                setGapStaggerEnabled(v);
                setShowGapUnitDropdown(false);
              }}
              trackColor={{
                false: isDark ? palette.white : palette.settingsIconBg,
                true: colors.primary,
              }}
              thumbColor={palette.largeFontbutton}
              trackBorderColor={colors.borderColor}
            />
          </View>
          {gapStaggerEnabled ? (
            <View style={[styles.gapFields, { borderTopColor: colors.borderColor }]}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption },
                ]}
              >
                Preference gap time
              </Text>
              <View style={styles.gapAmountRow}>
                <TextInput
                  style={[
                    styles.gapAmountInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.borderColor,
                      color: colors.text,
                    },
                  ]}
                  value={gapAmount}
                  onChangeText={setGapAmount}
                  placeholder={gapUnit === 'minutes' ? '1–5' : '1–300'}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.gapUnitSelect, { backgroundColor: colors.background, borderColor: colors.borderColor }]}
                  activeOpacity={0.8}
                  onPress={() => setShowGapUnitDropdown((prev) => !prev)}
                >
                  <Text
                    style={[
                      styles.gapUnitText,
                      { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.subhead },
                    ]}
                  >
                    {gapUnit === 'minutes' ? 'Minutes' : 'Seconds'}
                  </Text>
                  <MaterialIcons
                    name={showGapUnitDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={24}
                    color={arrowColor}
                  />
                </TouchableOpacity>
              </View>
              {showGapUnitDropdown ? (
                <View
                  style={[
                    styles.gapDropdown,
                    { backgroundColor: colors.background, borderColor: colors.borderColor },
                  ]}
                >
                  {(['minutes', 'seconds'] as const).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={styles.gapDropdownItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        setGapUnit(u);
                        setShowGapUnitDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.gapDropdownText,
                          { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.subhead },
                        ]}
                      >
                        {u === 'minutes' ? 'Minutes' : 'Seconds'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <Text
                style={[
                  styles.gapCapHint,
                  { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
                ]}
              >
                Maximum 5 minutes (300 seconds).
              </Text>
            </View>
          ) : null}
        </View>

        {/* Food Safety Confirmation */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
          ]}
        >
          Food Safety Confirmation
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption ,lineHeight:20},
          ]}
        >
          You must confirm each of the following before your listing can be published:
        </Text>

        <View style={styles.confirmList}>
          {SAFETY_ITEMS.map((item, index) => (
            <ConfirmationCheckbox
              key={index}
              label={item}
              checked={confirmations[index]}
              onToggle={() => toggleConfirmation(index)}
            />
          ))}
        </View>

            <ContinueButton
              label={publishing ? (editListing ? 'Saving…' : 'Publishing…') : (editListing ? 'Save changes' : 'Publish')}
              onPress={handlePublish}
              isDark={isDark}
              style={{
                ...styles.publishButton,
                ...(!allConfirmed || publishing ? styles.publishButtonDisabled : {}),
              }}
            />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,

  },
  sectionTitle: {
    // marginTop: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  authInputContainer: {
    marginBottom: 0,
  },
  addressLoadingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLoadingText: {},
  addressSuggestions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  addressSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  addressSuggestionText: {
    flex: 1,
  },
  noteInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fontFamilies.inter,
    fontSize: 14,
    minHeight: 100,
  },
  confirmList: {
    marginTop: 8,
    marginBottom: 8,
  },
  publishButton: {
    marginTop: 24,
    width: '100%',
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  timeFieldsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeFieldHalf: {
    flex: 1,
  },
  timeFieldLabel: {
    marginBottom: 8,
  },
  timeFieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
  },
  timeFieldValueWrap: {
    flex: 1,
  },
  timeFieldValue: {},
  timePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  timePickerModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 34,
  },
  timePickerModalTitle: {
    marginBottom: 16,
  },
  timePickerDoneBtn: {
    marginTop: 16,
    width: '100%',
  },
  gapCard: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 0,
  },
  gapSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  gapSwitchLabelWrap: {
    flex: 1,
  },
  gapSwitchTitle: {
    marginBottom: 4,
  },
  gapSwitchHint: {
    lineHeight: 18,
  },
  gapFields: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gapAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gapAmountInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontFamily: fontFamilies.inter,
    fontSize: 16,
  },
  gapUnitSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minWidth: 120,
  },
  gapUnitText: {},
  gapDropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gapDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  gapDropdownText: {},
  gapCapHint: {
    marginTop: 8,
  },
});
