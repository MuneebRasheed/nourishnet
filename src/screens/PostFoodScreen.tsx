import React, { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
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
import CategoryChips from '../components/CategoryChips';
import ContinueButton from '../components/ContinueButton';
import { AuthInput } from '../components/AuthInput';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import ArrowBACK from '../assets/svgs/ArrowBACK';
import { pickListingImage } from '../lib/uploadListingImage';

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
  foodImageUri?: string | null;
  foodImageBase64?: string | null;
  foodImageMimeType?: string | null;
};

export default function PostFoodScreen() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PostFoodScreen'>>();
  const editListing = route.params?.editListing;

  const [foodType, setFoodType] = useState<string | null>(editListing?.foodType ?? null);
  const [quantity, setQuantity] = useState(editListing?.quantity ?? '');
  const [quantityUnit, setQuantityUnit] = useState<string>(
    editListing?.quantityUnit && QUANTITY_UNITS.includes(editListing.quantityUnit)
      ? editListing.quantityUnit
      : QUANTITY_UNITS[0]
  );
  const [foodTitle, setFoodTitle] = useState(editListing?.title ?? '');
  const [foodImageUri, setFoodImageUri] = useState<string | null>(editListing?.imageUrl ?? null);
  const [foodImageBase64, setFoodImageBase64] = useState<string | null>(null);
  const [foodImageMimeType, setFoodImageMimeType] = useState<string | null>(null);
  const [dietarySelected, setDietarySelected] = useState<string[]>(editListing?.dietaryTags ?? []);
  const [allergensSelected, setAllergensSelected] = useState<string[]>(editListing?.allergens ?? []);
  const [showFoodTypeOptions, setShowFoodTypeOptions] = useState(false);
  const [showQuantityUnitOptions, setShowQuantityUnitOptions] = useState(false);

  useEffect(() => {
    if (editListing) {
      setFoodType(editListing.foodType ?? null);
      setQuantity(editListing.quantity ?? '');
      setQuantityUnit(
        editListing.quantityUnit && QUANTITY_UNITS.includes(editListing.quantityUnit)
          ? editListing.quantityUnit
          : QUANTITY_UNITS[0]
      );
      setFoodTitle(editListing.title ?? '');
      setFoodImageUri(editListing.imageUrl ?? null);
      setFoodImageBase64(null);
      setFoodImageMimeType(null);
      setDietarySelected(editListing.dietaryTags ?? []);
      setAllergensSelected(editListing.allergens ?? []);
    } else {
      setFoodType(null);
      setQuantity('');
      setQuantityUnit(QUANTITY_UNITS[0]);
      setFoodTitle('');
      setFoodImageUri(null);
      setFoodImageBase64(null);
      setFoodImageMimeType(null);
      setDietarySelected([]);
      setAllergensSelected([]);
    }
  }, [editListing]);

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
    const trimmedTitle = foodTitle.trim();
    const parsedQuantity = Number(quantity);
    const hasValidQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;

    if (!foodType) {
      Alert.alert('Missing required field', 'Please select a food type.');
      return;
    }
    if (!hasValidQuantity) {
      Alert.alert('Missing required field', 'Please enter a quantity greater than 0.');
      return;
    }
    if (!quantityUnit) {
      Alert.alert('Missing required field', 'Please select a quantity unit.');
      return;
    }
    if (!trimmedTitle) {
      Alert.alert('Missing required field', 'Please enter a food title.');
      return;
    }
    if (!foodImageUri) {
      Alert.alert('Missing required field', 'Please add a food image.');
      return;
    }

    const draft: PostFoodDraft = {
      foodType,
      quantity: String(parsedQuantity),
      quantityUnit,
      foodTitle: trimmedTitle,
      dietarySelected,
      allergensSelected,
      foodImageUri,
      foodImageBase64,
      foodImageMimeType,
    };
    navigation.navigate('PostPublishScreen', { draft, editListing: editListing ?? undefined });
  };

  const handlePickFoodImage = async () => {
    const picked = await pickListingImage();
    if (!picked) return;
    if ('denied' in picked && picked.denied) {
      Alert.alert('Permission required', 'Please allow photo library access to add a food image.');
      return;
    }
    if (!('uri' in picked)) return;
    setFoodImageUri(picked.uri);
    setFoodImageBase64(picked.base64);
    setFoodImageMimeType(picked.mimeType);
  };

  const handleRemoveFoodImage = () => {
    setFoodImageUri(null);
    setFoodImageBase64(null);
    setFoodImageMimeType(null);
  };

  const arrowColor = isDark ? colors.textSecondary : colors.text;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <MaterialIcons
              name={showFoodTypeOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color={arrowColor}
            />
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
            Quantity*
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
              <MaterialIcons
                name={showQuantityUnitOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={arrowColor}
              />
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

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead }]}>
            Food Image*
          </Text>
          <TouchableOpacity
            style={[styles.imagePickerButton, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}
            activeOpacity={0.8}
            onPress={handlePickFoodImage}
          >
            <MaterialIcons name="add-a-photo" size={20} color={colors.text} />
            <Text style={[styles.imagePickerButtonText, { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
              {foodImageUri ? 'Change image' : 'Add image'}
            </Text>
          </TouchableOpacity>
          {foodImageUri ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: foodImageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity
                style={[styles.removeImageButton, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}
                onPress={handleRemoveFoodImage}
                activeOpacity={0.8}
              >
                <MaterialIcons name="delete-outline" size={18} color={colors.text} />
                <Text style={[styles.removeImageText, { color: colors.text, fontFamily: fontFamilies.inter }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Dietary Tags */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead },
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
            { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.subhead },
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
  imagePickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imagePickerButtonText: {},
  imagePreviewWrap: {
    marginTop: 10,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeImageText: {},
  nextButton: {
    marginTop: 32,
    width: '100%',
  },
  fieldGroup2: {
    marginTop: 12,
  },
});
