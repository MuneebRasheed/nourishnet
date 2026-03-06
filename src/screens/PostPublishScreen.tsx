import React, { useState } from 'react';
import {
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
  const addListing = useProviderListingsStore((s) => s.addListing);

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
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [note, setNote] = useState('');
  const [confirmations, setConfirmations] = useState<boolean[]>([false, false, false, false]);

  const openTimePickerModal = () => {
    if (pickupStart === null) setPickupStart(getDefaultStart());
    if (pickupEnd === null) setPickupEnd(getDefaultEnd());
    setShowTimePickerModal(true);
  };

  const handleStartTimeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (date) setPickupStart(date);
  };

  const handleEndTimeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (date) setPickupEnd(date);
  };

  const pickupWindowLabel =
    pickupStart && pickupEnd
      ? `${formatTimeForDisplay(pickupStart)} – ${formatTimeForDisplay(pickupEnd)}`
      : null;

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
  const handlePublish = () => {
    if (!allConfirmed) return;

    const draft = route.params?.draft;
    if (!draft) {
      return;
    }

    addListing({
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

    navigation.navigate('MainTabs', { screen: 'Home' });
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
          <TouchableOpacity
            style={[styles.pickupWindowCard, { backgroundColor: colors.inputFieldBg }]}
            activeOpacity={0.8}
            onPress={openTimePickerModal}
          >
            <ClockICon
              width={24}
              height={24}
              color={isDark ? colors.text : colors.primary}
            />
            <View style={styles.pickupWindowTextWrap}>
              <Text
                style={[
                  styles.pickupWindowLabel,
                  { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
                ]}
              >
                Pickup Window
              </Text>
              <Text
                style={[
                  styles.pickupWindowTime,
                  {
                    color: pickupWindowLabel ? colors.text : colors.textSecondary,
                    fontFamily: fontFamilies.interBold,
                    fontSize: fonts.subhead,
                  },
                ]}
              >
                {pickupWindowLabel ?? 'Select time'}
              </Text>
            </View>
            <MaterialIcons
              name={showTimePickerModal ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color={arrowColor}
            />
          </TouchableOpacity>

          <Modal
            visible={showTimePickerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTimePickerModal(false)}
          >
            <TouchableOpacity
              style={styles.timePickerOverlay}
              activeOpacity={1}
              onPress={() => setShowTimePickerModal(false)}
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
                  Pickup Window
                </Text>
                <TouchableOpacity
                  style={[styles.timePickerRow, { backgroundColor: colors.inputFieldBg }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={[styles.timePickerRowLabel, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
                    Start time
                  </Text>
                  <Text style={[styles.timePickerRowValue, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead }]}>
                    {pickupStart ? formatTimeForDisplay(pickupStart) : '--'}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={pickupStart ?? getDefaultStart()}
                    mode="time"
                    display="spinner"
                    onChange={handleStartTimeChange}
                  />
                )}
                <TouchableOpacity
                  style={[styles.timePickerRow, { backgroundColor: colors.inputFieldBg }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={[styles.timePickerRowLabel, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
                    End time
                  </Text>
                  <Text style={[styles.timePickerRowValue, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead }]}>
                    {pickupEnd ? formatTimeForDisplay(pickupEnd) : '--'}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && Platform.OS === 'ios' && (
                  <DateTimePicker
                    value={pickupEnd ?? getDefaultEnd()}
                    mode="time"
                    display="spinner"
                    onChange={handleEndTimeChange}
                  />
                )}
                <ContinueButton
                  label="Done"
                  onPress={() => setShowTimePickerModal(false)}
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
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
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
              label="Publish"
              onPress={handlePublish}
              isDark={isDark}
              style={{
                ...styles.publishButton,
                ...(!allConfirmed ? styles.publishButtonDisabled : {}),
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
  pickupWindowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  pickupWindowTextWrap: {
    flex: 1,
  },
  pickupWindowLabel: {
    marginBottom: 2,
  },
  pickupWindowTime: {},
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
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  timePickerRowLabel: {},
  timePickerRowValue: {},
  timePickerDoneBtn: {
    marginTop: 16,
    width: '100%',
  },
});
