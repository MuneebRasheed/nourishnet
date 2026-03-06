import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import ContinueButton from './ContinueButton';
import ForwardArrow from '../assets/svgs/ForwardArrow';
import XCircle from '../assets/svgs/XCircle';

const ALLERGEN_OPTIONS = ['Gluten', 'Eggs', 'Nuts', ];

export type FilterState = {
  foodType: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  allergens: string[];
  city: string;
};

const defaultFilterState: FilterState = {
  foodType: '',
  pickupTimeStart: '03:30PM',
  pickupTimeEnd: '03:30PM',
  allergens: [],
  city: '',
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
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

  const handleReset = () => {
    setFoodType(defaultFilterState.foodType);
    setPickupTimeStart(defaultFilterState.pickupTimeStart);
    setPickupTimeEnd(defaultFilterState.pickupTimeEnd);
    setAllergens(defaultFilterState.allergens);
    setCity(defaultFilterState.city);
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
              <View style={styles.timeRow}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: colors.inputFieldBg,
                      color: colors.text,
                      fontFamily: fontFamilies.inter,
                      fontSize: fonts.subhead,
                    },
                  ]}
                  value={pickupTimeStart}
                  onChangeText={setPickupTimeStart}
                  placeholder="03:30PM"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: colors.inputFieldBg,
                      color: colors.text,
                      fontFamily: fontFamilies.inter,
                      fontSize: fonts.subhead,
                    },
                  ]}
                  value={pickupTimeEnd}
                  onChangeText={setPickupTimeEnd}
                  placeholder="03:30PM"
                  placeholderTextColor={colors.textSecondary}
                />
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
                      key={item}
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
                      key={item}
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
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
