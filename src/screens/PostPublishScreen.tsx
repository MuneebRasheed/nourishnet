import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import ContinueButton from '../components/ContinueButton';
import { AuthInput } from '../components/AuthInput';
import ConfirmationCheckbox from '../components/ConfirmationCheckbox';
import ArrowBACK from '../assets/svgs/ArrowBACK';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';
import { useProviderListingsStore } from '../../store/providerListingsStore';
import { createListingApi } from '../lib/api/listings';

function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

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
  const addListingFromApi = useProviderListingsStore((s) => s.addListingFromApi);
  const [publishing, setPublishing] = useState(false);

  const [pickupAddress, setPickupAddress] = useState('');
  const getDefaultStart = () => {
    const d = new Date();
    d.setHours(16, 0, 0, 0);
    return d;
  };
  const getDefaultEnd = () => {
    const d = new Date();
    d.setHours(17, 30, 0, 0);
    return d;
  };
  const [pickupStart, setPickupStart] = useState<Date | null>(null);
  const [pickupEnd, setPickupEnd] = useState<Date | null>(null);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end' | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [note, setNote] = useState('');
  const [confirmations, setConfirmations] = useState<boolean[]>([false, false, false, false]);

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
  const handlePublish = async () => {
    if (!allConfirmed) return;

    const draft = route.params?.draft;
    if (!draft) return;

    setPublishing(true);
    try {
      const { listing, error } = await createListingApi({
        title: draft.foodTitle || 'Food name',
        foodType: draft.foodType,
        quantity: draft.quantity,
        quantityUnit: draft.quantityUnit,
        dietaryTags: draft.dietarySelected,
        allergens: draft.allergensSelected,
        pickupAddress,
        startTime: pickupStart ? formatTimeForDisplay(pickupStart) : '4:00 PM',
        endTime: pickupEnd ? formatTimeForDisplay(pickupEnd) : '5:30 PM',
        note,
      });
      if (error || !listing) {
        Alert.alert('Error', error ?? 'Failed to publish. Please try again.');
        return;
      }
      addListingFromApi(listing);
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <SettingsHeader
          title="Post Food"
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
            label="Pickup Address"
            placeholder="Enter pickup address"
            value={pickupAddress}
            onChangeText={setPickupAddress}
            leftIcon={<LocationPin width={20} height={20} color={colors.textSecondary} />}
            containerStyle={styles.authInputContainer}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.timeFieldsRow}>
            <View style={styles.timeFieldHalf}>
              <Text style={[styles.timeFieldLabel, { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
                Start Time
              </Text>
              <TouchableOpacity
                style={[styles.timeFieldCard, { backgroundColor: colors.inputFieldBg }]}
                activeOpacity={0.8}
                onPress={openStartTimePicker}
              >
                <LocationPin width={20} height={20} color={isDark ? colors.text : colors.primary} />
                <Text
                  style={[
                    styles.timeFieldValue,
                    { color: pickupStart ? colors.text : colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead },
                  ]}
                >
                  {pickupStart ? formatTimeForDisplay(pickupStart) : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeFieldHalf}>
              <Text style={[styles.timeFieldLabel, { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
                End Time
              </Text>
              <TouchableOpacity
                style={[styles.timeFieldCard, { backgroundColor: colors.inputFieldBg }]}
                activeOpacity={0.8}
                onPress={openEndTimePicker}
              >
                <ClockICon width={20} height={20} color={isDark ? colors.text : colors.primary} />
                <Text
                  style={[
                    styles.timeFieldValue,
                    { color: pickupEnd ? colors.text : colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead },
                  ]}
                >
                  {pickupEnd ? formatTimeForDisplay(pickupEnd) : 'Select'}
                </Text>
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
              label={publishing ? 'Publishing…' : 'Publish'}
              onPress={handlePublish}
              isDark={isDark}
              style={{
                ...styles.publishButton,
                ...(!allConfirmed || publishing ? styles.publishButtonDisabled : {}),
              }}
            />
      </ScrollView>
    </View>
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
});
