import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Platform,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import ContinueButton from './ContinueButton';
import ForwardArrow from '../assets/svgs/ForwardArrow';
import XCircle from '../assets/svgs/XCircle';
import ArrowDown from '../assets/svgs/ArrowDown';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';

const ALLERGEN_OPTIONS = [
  'Gluten',
  'Dairy',
  'Eggs',
  'Nuts',
  'Peanuts',
  'Shellfish',
  'Fish',
  'Sesame',
  'Soy',
];

const FOOD_TYPE_OPTIONS = ['Prepared Meals', 'Baked Goods', 'Produce', 'Dairy', 'Pantry'];

const CITY_OPTIONS = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];

function formatTimeForFilter(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(/\s/g, '');
}

export function parseTimeForFilter(s: string): Date | null {
  if (!s || typeof s !== 'string') return null;
  const trimmed = s.trim().replace(/\s/g, '');
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i) ?? trimmed.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
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

export type FilterState = {
  foodType: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  allergens: string[];
  city: string;
};

export const defaultFilterState: FilterState = {
  foodType: '',
  pickupTimeStart: '',
  pickupTimeEnd: '',
  allergens: [],
  city: '',
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
  onReset?: () => void;
  /** When provided, modal syncs its state to this when opened (e.g. currently applied filters). */
  initialFilters?: FilterState | null;
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters,
}: FilterModalProps) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();

  const [foodType, setFoodType] = useState(defaultFilterState.foodType);
  const [pickupTimeStart, setPickupTimeStart] = useState(
    defaultFilterState.pickupTimeStart
  );
  const [pickupTimeEnd, setPickupTimeEnd] = useState(
    defaultFilterState.pickupTimeEnd
  );
  const [allergens, setAllergens] = useState<string[]>(
    defaultFilterState.allergens
  );
  const [city, setCity] = useState(defaultFilterState.city);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);

  // Sync modal state when opened with initialFilters (e.g. currently applied filters)
  React.useEffect(() => {
    if (visible && initialFilters !== undefined) {
      if (initialFilters === null) {
        setFoodType(defaultFilterState.foodType);
        setPickupTimeStart(defaultFilterState.pickupTimeStart);
        setPickupTimeEnd(defaultFilterState.pickupTimeEnd);
        setAllergens(defaultFilterState.allergens);
        setCity(defaultFilterState.city);
      } else {
        setFoodType(initialFilters.foodType);
        setPickupTimeStart(initialFilters.pickupTimeStart);
        setPickupTimeEnd(initialFilters.pickupTimeEnd);
        setAllergens(initialFilters.allergens);
        setCity(initialFilters.city);
      }
    }
  }, [visible, initialFilters]);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end' | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFoodTypePicker, setShowFoodTypePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

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

  const openStartTimePicker = () => {
    setTimePickerMode('start');
    setShowEndPicker(false);
    setShowStartPicker(true);
    if (Platform.OS === 'ios') setShowTimePickerModal(true);
  };

  const openEndTimePicker = () => {
    setTimePickerMode('end');
    setShowStartPicker(false);
    setShowEndPicker(true);
    if (Platform.OS === 'ios') setShowTimePickerModal(true);
  };

  const closeTimePickerModal = () => {
    setShowTimePickerModal(false);
    setTimePickerMode(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleStartTimeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowTimePickerModal(false);
    }
    if (date) setPickupTimeStart(formatTimeForFilter(date));
  };

  const handleEndTimeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
      setShowTimePickerModal(false);
    }
    if (date) setPickupTimeEnd(formatTimeForFilter(date));
  };

  const handleReset = () => {
    setFoodType(defaultFilterState.foodType);
    setPickupTimeStart(defaultFilterState.pickupTimeStart);
    setPickupTimeEnd(defaultFilterState.pickupTimeEnd);
    setAllergens(defaultFilterState.allergens);
    setCity(defaultFilterState.city);
    onReset?.();
  };

  const handleApply = () => {
    onApply?.({
      foodType,
      pickupTimeStart,
      pickupTimeEnd,
      allergens,
      city,
    });
    onClose();
  };

  const addAllergen = (item: string) => {
    if (!allergens.includes(item)) setAllergens([...allergens, item]);
  };

  const removeAllergen = (item: string) => {
    setAllergens(allergens.filter((a) => a !== item));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.overlayBg]} />
        </View>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerWrapper}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                    fontFamily: fontFamilies.interBold,
                    fontSize: fonts.title,
                  },
                ]}
              >
                Filter
              </Text>
              <TouchableOpacity
                onPress={handleReset}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text
                  style={[
                    styles.resetText,
                    {
                      color: colors.primary,
                      fontFamily: fontFamilies.inter,
                      fontSize: fonts.caption,
                    },
                  ]}
                >
                  Reset filters
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.headerBorder,
                { backgroundColor: colors.borderColor },
              ]}
            />
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            

            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                    fontFamily: fontFamilies.interMedium,
                    fontSize: fonts.subhead,
                  },
                ]}
              >
                Food Type
              </Text>
              <TouchableOpacity
                style={[styles.inputRow, { backgroundColor: colors.inputFieldBg }]}
                activeOpacity={0.8}
                onPress={() => setShowFoodTypePicker(true)}
              >
                <Text
                  style={[
                    styles.inputPlaceholder,
                    {
                      color: foodType ? colors.text : colors.textSecondary,
                      fontFamily: fontFamilies.inter,
                      fontSize: fonts.body,
                    },
                  ]}
                >
                  {foodType || 'Select type'}
                </Text>
                <View style={[styles.chevron, { transform: [{ rotate: '90deg' }] }]}>
                  <ForwardArrow
                    width={18}
                    height={18}
                    stroke={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              <Modal
                visible={showFoodTypePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFoodTypePicker(false)}
              >
                <TouchableOpacity
                  style={styles.timePickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowFoodTypePicker(false)}
                >
                  <View
                    style={[styles.timePickerModal, { backgroundColor: colors.background }]}
                    onStartShouldSetResponder={() => true}
                  >
                    <Text
                      style={[
                        styles.timePickerModalTitle,
                        { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead },
                      ]}
                    >
                      Food Type
                    </Text>
                    <ScrollView
                      style={styles.foodTypeOptionsScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {FOOD_TYPE_OPTIONS.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[styles.foodTypeOptionRow, { borderBottomColor: colors.borderColor }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setFoodType(type);
                            setShowFoodTypePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.foodTypeOptionText,
                              { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.body },
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                    fontFamily: fontFamilies.interMedium,
                    fontSize: fonts.subhead,
                  },
                ]}
              >
                Pickup Time
              </Text>
              <View style={styles.timeFieldsRow}>
                <View style={styles.timeFieldHalf}>
                 
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
                          {
                            color: colors.text,
                            fontFamily: fontFamilies.inter,
                            fontSize: fonts.subhead,
                          },
                        ]}
                      >
                        {pickupTimeStart || 'Select'}
                      </Text>
                    </View>
                    <ArrowDown width={20} height={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.timeFieldHalf}>
                 
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
                          {
                            color: colors.text,
                            fontFamily: fontFamilies.inter,
                            fontSize: fonts.subhead,
                          },
                        ]}
                      >
                        {pickupTimeEnd || 'Select'}
                      </Text>
                    </View>
                    <ArrowDown width={20} height={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
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
                      {
                        color: colors.text,
                        fontFamily: fontFamilies.interBold,
                        fontSize: fonts.body,
                      },
                    ]}
                  >
                    {timePickerMode === 'start' ? 'Start Time' : 'End Time'}
                  </Text>
                  {timePickerMode === 'start' && Platform.OS === 'ios' && (
                    <DateTimePicker
                      value={parseTimeForFilter(pickupTimeStart) ?? getDefaultStart()}
                      mode="time"
                      display="spinner"
                      themeVariant={isDark ? 'dark' : 'light'}
                      onChange={handleStartTimeChange}
                    />
                  )}
                  {timePickerMode === 'end' && Platform.OS === 'ios' && (
                    <DateTimePicker
                      value={parseTimeForFilter(pickupTimeEnd) ?? getDefaultEnd()}
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
                value={parseTimeForFilter(pickupTimeStart) ?? getDefaultStart()}
                mode="time"
                display="default"
                onChange={handleStartTimeChange}
              />
            )}
            {showEndPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={parseTimeForFilter(pickupTimeEnd) ?? getDefaultEnd()}
                mode="time"
                display="default"
                onChange={handleEndTimeChange}
              />
            )}

            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                    fontFamily: fontFamilies.interMedium,
                    fontSize: fonts.subhead,
                  },
                ]}
              >
                Allergens
              </Text>
              <View
                style={[
                  styles.allergenInputContainer,
                  { backgroundColor: colors.inputFieldBg },
                ]}
              >
                <View style={styles.allergenInnerRow}>
                  {allergens.map((item) => (
                    <TouchableOpacity
                      key={`selected-${item}`}
                      onPress={() => removeAllergen(item)}
                      activeOpacity={0.8}
                      style={[styles.allergenChip, { backgroundColor: colors.primary }]}
                    >
                      <Text
                        style={[
                          styles.allergenChipText,
                          {
                            color: palette.white,
                            fontFamily: fontFamilies.inter,
                            fontSize: fonts.caption,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                      <View style={styles.chipRemove}>
                        <XCircle
                          width={14}
                          height={14}
                          color={palette.white}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                  {ALLERGEN_OPTIONS.filter((opt) => !allergens.includes(opt)).map((item) => (
                    <TouchableOpacity
                      key={`option-${item}`}
                      onPress={() => addAllergen(item)}
                      activeOpacity={0.8}
                      style={styles.allergenOptionTextWrap}
                    >
                      <Text
                        style={[
                          styles.allergenOptionText,
                          {
                            color: colors.textSecondary,
                            fontFamily: fontFamilies.inter,
                            fontSize: fonts.caption,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.text,
                    fontFamily: fontFamilies.interMedium,
                    fontSize: fonts.subhead,
                  },
                ]}
              >
                City
              </Text>
              <TouchableOpacity
                style={[styles.inputRow, { backgroundColor: colors.inputFieldBg }]}
                activeOpacity={0.8}
                onPress={() => setShowCityPicker(true)}
              >
                <Text
                  style={[
                    styles.inputPlaceholder,
                    {
                      color: city ? colors.text : colors.textSecondary,
                      fontFamily: fontFamilies.inter,
                      fontSize: fonts.body,
                    },
                  ]}
                >
                  {city || 'Please select'}
                </Text>
                <View style={[styles.chevron, { transform: [{ rotate: '90deg' }] }]}>
                  <ForwardArrow
                    width={18}
                    height={18}
                    stroke={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              <Modal
                visible={showCityPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCityPicker(false)}
              >
                <TouchableOpacity
                  style={styles.timePickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowCityPicker(false)}
                >
                  <View
                    style={[styles.timePickerModal, { backgroundColor: colors.background }]}
                    onStartShouldSetResponder={() => true}
                  >
                    <Text
                      style={[
                        styles.timePickerModalTitle,
                        { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead },
                      ]}
                    >
                      City
                    </Text>
                    <ScrollView
                      style={styles.foodTypeOptionsScroll}
                      showsVerticalScrollIndicator={true}
                    >
                      {CITY_OPTIONS.map((name) => (
                        <TouchableOpacity
                          key={name}
                          style={[styles.foodTypeOptionRow, { borderBottomColor: colors.borderColor }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setCity(name);
                            setShowCityPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.foodTypeOptionText,
                              { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.body },
                            ]}
                          >
                            {name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            <ContinueButton
              label="Apply"
              onPress={handleApply}
              isDark={isDark}
              backgroundColor={colors.primary}
              textColor={palette.white}
              style={styles.applyBtn}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
   
  },
  overlayBg: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    
  },
  handle: {
    
  },
  scroll: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    
  },
  headerWrapper: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerBorder: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  title: {},
  resetText: {},
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  inputPlaceholder: {},
  chevron: {},
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  foodTypeOptionsScroll: {
    maxHeight: 240,
  },
  foodTypeOptionRow: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  foodTypeOptionText: {},
  timePickerDoneBtn: {
    marginTop: 16,
    width: '100%',
  },
  allergenInputContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  allergenInnerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    gap: 6,
  },
  allergenChipText: {},
  allergenOptionTextWrap: {
    paddingVertical: 4,
  },
  allergenOptionText: {},
  chipRemove: {
    marginLeft: 2,
  },
  applyBtn: {
    width: '100%',
    marginTop: 12,
  },
});
