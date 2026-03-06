import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import SettingsHeader from '../components/SettingsHeader';
import CategoryChips from '../components/CategoryChips';
import ContinueButton from '../components/ContinueButton';
import { AuthInput } from '../components/AuthInput';
import ChevronLeft from '../assets/svgs/ChevronLeft';
import ArrowDown from '../assets/svgs/ArrowDown';
import ArrowBACK from '../assets/svgs/ArrowBACK';

const FOOD_TYPES = ['Prepared Meals', 'Baked Goods', 'Produce', 'Dairy', 'Pantry', 'Other'];
const QUANTITY_UNITS = ['Bags', 'Portions', 'Pounds', 'Kilos', 'Servings', 'Items'];
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Dairy-Free', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free'];
const ALLERGENS = ['None', 'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Shellfish', 'Fish', 'Sesame', 'Soy'];

export type PostFoodDraft = {
  foodType: string | null;
  quantity: string;
  quantityUnit: string;
  foodTitle: string;
  dietarySelected: string[];
  allergensSelected: string[];
};

export default function PostFoodScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [foodType, setFoodType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<string>(QUANTITY_UNITS[0]);
  const [foodTitle, setFoodTitle] = useState('');
  const [dietarySelected, setDietarySelected] = useState<string[]>([]);
  const [allergensSelected, setAllergensSelected] = useState<string[]>([]);
  const [showFoodTypeOptions, setShowFoodTypeOptions] = useState(false);
  const [showQuantityUnitOptions, setShowQuantityUnitOptions] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const toggleDietary = (tag: string) => {
    setDietarySelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAllergen = (tag: string) => {
    setAllergensSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNextStep = () => {
    const draft: PostFoodDraft = {
      foodType,
      quantity,
      quantityUnit,
      foodTitle,
      dietarySelected,
      allergensSelected,
    };
    navigation.navigate('PostPublishScreen', { draft });
  };

  const arrowColor = isDark ? colors.textSecondary : colors.text;

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
          { paddingBottom: insets.bottom + 10},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Food Details */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
          ]}
        >
          Food Details
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
          ]}
        >
          Tell us about the food you're sharing.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead }]}>
            Food Type*
          </Text>
          <TouchableOpacity
            style={[styles.selectRow, { backgroundColor: colors.inputFieldBg }]}
            activeOpacity={0.8}
            onPress={() => setShowFoodTypeOptions((prev) => !prev)}
          >
            <Text
              style={[
                styles.selectText,
                {
                  color: foodType ? colors.text : colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.subhead,
                },
              ]}
            >
              {foodType ?? 'Select food type'}
            </Text>
            <ArrowDown width={20} height={20} color={arrowColor} />
          </TouchableOpacity>
          {showFoodTypeOptions && (
            <View style={[styles.dropdown, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}>
              {FOOD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setFoodType(type);
                    setShowFoodTypeOptions(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      {
                        color: colors.text,
                        fontFamily: fontFamilies.inter,
                        fontSize: fonts.subhead,
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead }]}>
            Quantity
          </Text>
          <View style={styles.quantityRow}>
            <TextInput
              style={[
                styles.quantityInput,
                { backgroundColor: colors.inputFieldBg,  color: colors.text },
              ]}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.unitSelect, { backgroundColor: colors.inputFieldBg }]}
              activeOpacity={0.8}
              onPress={() => setShowQuantityUnitOptions((prev) => !prev)}
            >
              <Text style={[styles.unitText, { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
                {quantityUnit}
              </Text>
              <ArrowDown width={20} height={20} color={arrowColor} />
            </TouchableOpacity>
          </View>
          {showQuantityUnitOptions && (
            <View style={[styles.dropdown, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}>
              {QUANTITY_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={styles.dropdownItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setQuantityUnit(unit);
                    setShowQuantityUnitOptions(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      {
                        color: colors.text,
                        fontFamily: fontFamilies.inter,
                        fontSize: fonts.subhead,
                      },
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <AuthInput
            type="text"
            label="Food Title*"
            placeholder="e.g., Fresh Vegetable Curry"
            value={foodTitle}
            onChangeText={setFoodTitle}
            containerStyle={styles.authInputContainer}
          />
        </View>

        {/* Dietary Tags */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
          ]}
        >
          Dietary Tags
        </Text>
        <CategoryChips
          categories={DIETARY_TAGS}
          selected={dietarySelected}
          onSelect={toggleDietary}
          multiSelect
          wrap
        />

        {/* Allergens */}
        <View style={styles.fieldGroup2}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
          ]}
        >
          Allergens
        </Text>
        <CategoryChips
          categories={ALLERGENS}
          selected={allergensSelected}
          onSelect={toggleAllergen}
          multiSelect
          wrap
        />
</View>
        <ContinueButton
          label="Next Step"
          onPress={handleNextStep}
          isDark={isDark}
          style={styles.nextButton}
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
    paddingTop: 8,
  },
  sectionTitle: {
    
    marginBottom: 12,
  },
  sectionSubtitle: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  selectText: {},
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
 
    fontFamily: fontFamilies.inter,
    fontSize: 14,
  },
  unitSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownText: {},
  unitText: {},
  authInputContainer: {
    marginBottom: 0,
  },
  nextButton: {
    marginTop: 32,
    width: '100%',
  },
  fieldGroup2:{
    marginTop: 12,
  }
});
