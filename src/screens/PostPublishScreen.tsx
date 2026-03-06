import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import ContinueButton from '../components/ContinueButton';
import { AuthInput } from '../components/AuthInput';
import ConfirmationCheckbox from '../components/ConfirmationCheckbox';
import TimeInputField from '../components/TimeInputField';
import ArrowBACK from '../assets/svgs/ArrowBACK';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';
import { useProviderListingsStore } from '../../store/providerListingsStore';

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

  const [pickupAddress, setPickupAddress] = useState('123 Main Street, Downtown');
  const [startTime, setStartTime] = useState('4:40PM');
  const [endTime, setEndTime] = useState('4:40PM');
  const [note, setNote] = useState('');
  const [confirmations, setConfirmations] = useState<boolean[]>([false, false, false, false]);

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
      startTime,
      endTime,
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

        <View style={styles.timeRow}>
          <TimeInputField
            label="Start Time"
            value={startTime}
            onChangeText={setStartTime}
            placeholder="4:40"
            icon={<ClockICon width={20} height={20} color={colors.textSecondary} />}
          />
          <TimeInputField
            label="End Time"
            value={endTime}
            onChangeText={setEndTime}
            placeholder="4:40"
            icon={<ClockICon width={20} height={20} color={colors.textSecondary} />}
          />
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
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
});
