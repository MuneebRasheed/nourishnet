import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useRequestedListingsStore } from '../../store/requestedListingsStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { RootStackParamList } from '../navigations/RootNavigation';
import PickupDetailsCard from '../components/PickupDetailsCard';
import NavigateShareBar from '../components/NavigateShareBar';
import ContinueButton from '../components/ContinueButton';
import { VerifyPickupModal } from '../components/VerifyPickupModal';
import TimerIcon from '../assets/svgs/TimerIcon';
import LockIcon from '../assets/svgs/LockIcon';
import BarcodeIcon from '../assets/svgs/BarcodeIcon';
import { FoodCardData } from '../components/FoodCard';
import { Ionicons } from '@expo/vector-icons';

export type FoodDetailItem = FoodCardData & {
  pickupAddress?: string;
  pickupTimeNote?: string;
  pickupInstructions?: string;
  quantity?: number;
  /** Allergens declared by provider (e.g. Gluten, Dairy) */
  allergens?: string[];
  /** Food type from post (e.g. Produce, Baked Goods) */
  foodType?: string;
  /** Optional provider avatar image; when absent, first letter of source is shown */
  providerImage?: ImageSourcePropType;
};

function FoodDetailScreen() {
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [showPinQrButtons, setShowPinQrButtons] = useState(false);
  const [showVerifyPickupModal, setShowVerifyPickupModal] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'FoodDetailScreen'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'FoodDetailScreen'>>();
  const item = route.params?.item;

  useEffect(() => {
    if (!requestSubmitted) return;
    const t = setTimeout(() => setShowPinQrButtons(true), 2000);
    return () => clearTimeout(t);
  }, [requestSubmitted]);

  const openVerifyPickupModal = () => setShowVerifyPickupModal(true);
  const closeVerifyPickupModal = () => setShowVerifyPickupModal(false);

  const handleVerifyPickup = (pin: string) => {
    // TODO: verify PIN with provider / API
  };

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No food item selected.</Text>
      </View>
    );
  }

  const quantityNum = item.quantity ?? (parseInt(item.portions.replace(/\D/g, ''), 10) || 0);
  const locationPrimary = item.pickupAddress || item.distance;
  const locationSecondary = item.pickupAddress ? item.distance : undefined;
  const timePrimary = item.timeSlot;
  const timeSecondary = item.pickupTimeNote;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    
        <View style={styles.imageWrap}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.inputFieldBg }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 0,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontFamily: fontFamilies.poppinsSemiBold, fontSize: fonts.largeTitle },
            ]}
          >
            {item.title}
          </Text>

          <View style={styles.providerRow}>
            <View style={[styles.avatar, { backgroundColor:isDark ? colors.inputFieldBg : colors.surfaceBorder }]}>
              {item.providerImage != null ? (
                <Image source={item.providerImage} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={[styles.avatarLetter, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption }]}>
                  {item.source.charAt(0)}
                </Text>
              )}
            </View>
            <View style={styles.providerTextWrap}>
              <Text
                style={[
                  styles.providerLabel,
                  { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
                ]}
              >
                Provider
              </Text>
              <Text
                style={[
                  styles.providerName,
                  { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
                ]}
              >
                {item.source}
              </Text>
            </View>
          </View>

          <View style={styles.pickupDetailsWrap}>
            <PickupDetailsCard
              locationPrimary={locationPrimary}
              locationSecondary={locationSecondary}
              timePrimary={timePrimary}
              timeSecondary={timeSecondary}
            />
          </View>

          {item.foodType != null && item.foodType !== '' && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.subhead },
                ]}
              >
                Food Type
              </Text>
              <Text style={[styles.foodTypeText, { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.body }]}>
                {item.foodType}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.subhead },
              ]}
            >
              Quantity Available
            </Text>
            <View style={styles.quantityRow}>
              <View style={[styles.quantityChip, { backgroundColor: colors.inputFieldBg,  }]}>
                <Text style={[styles.quantityNum, { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body }]}>
                  {quantityNum}
                </Text>
              </View>
              <Text style={[styles.quantityLabel, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
                meals available
              </Text>
            </View>
          </View>

          {item.dietaryTags && item.dietaryTags.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
                ]}
              >
                Dietary Tags
              </Text>
              <View style={styles.tagsRow}>
                {item.dietaryTags.map((tag) => (
                  <View key={tag} style={[styles.dietaryTag, { backgroundColor: isDark ? colors.inputFieldBg : palette.roleCard }]}>
                    <Text style={[styles.dietaryTagText, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {item.allergens && item.allergens.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
                ]}
              >
                Allergen Information
              </Text>
              <View style={[styles.allergenCard, { backgroundColor: isDark ? colors.inputFieldBg : palette.roleCardbg, borderColor: isDark ? palette.glutenColor : 'transparent', borderWidth: 1 }]}>
                <View style={styles.allergenHeader}>
                  <View style={styles.allergenIconWrap}>
                    <Ionicons name="alert-circle-outline" size={20} color={isDark ? palette.roleBulbColor3 : palette.roleBulbColor1} />
                    <Text
                      style={[
                        styles.allergenTitle,
                        { color: isDark ? palette.roleBulbColor3 : palette.roleBulbColor1, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption },
                      ]}
                    >
                      Contains allergens
                    </Text>
                  </View>
                  <View style={styles.allergenTags}>
                    {item.allergens.map((tag) => (
                      <View key={tag} style={[styles.allergenTag, { backgroundColor: palette.glutenColor }]}>
                        <Text style={[styles.allergenTagText, { color: isDark ? palette.roleBulbColor3 : palette.roleBulbColor1, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {(item.pickupInstructions != null && item.pickupInstructions !== '') && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.body },
                ]}
              >
                Notes
              </Text>
              <View style={[styles.instructionsBox, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderColor }]}>
                <Text style={[styles.instructionsText, { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.body }]}>
                  {item.pickupInstructions}
                </Text>
              </View>
            </View>
          )}


          <NavigateShareBar
            onNavigate={() => {
              // TODO: open maps / navigate to pickup address
            }}
            onShare={() => {
              // TODO: share food item
            }}
            style={styles.navigateShareBar}
          />

          {requestSubmitted ? (
            showPinQrButtons ? (
              <View style={styles.pinQrRow}>
                <ContinueButton
                  label="Pin Code"
                  onPress={openVerifyPickupModal}
                  isDark={isDark}
                  backgroundColor={colors.primary}
                  textColor={palette.white}
                  icon={<LockIcon width={20} height={20} color={palette.white} />}
                  iconPosition="left"
                  style={styles.pinQrBtn}
                />
                <ContinueButton
                  label="QR Code"
                  onPress={() => navigation.navigate('QRCodeScreen')}
                  isDark={isDark}
                  backgroundColor={colors.inputFieldBg}
                  textColor={colors.text}
                  icon={<BarcodeIcon width={20} height={20} color={colors.text} />}
                  iconPosition="left"
                  style={styles.pinQrBtn}
                />
              </View>
            ) : (
              <View style={[styles.requestSubmittedBtn, { backgroundColor: colors.inputFieldBg }]}>
                <TimerIcon width={20} height={20} color={colors.textSecondary} />
                <Text style={[styles.requestSubmittedText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.body }]}>
                  Request Submitted
                </Text>
              </View>
            )
          ) : (
            <ContinueButton
              label="Request This Food"
              onPress={() => {
                useRequestedListingsStore.getState().addRequestedId(item.id);
                setRequestSubmitted(true);
              }}
              isDark={isDark}
              style={styles.requestBtn}
            />
          )}

          <View style={styles.bottomContainer}>
            <Text style={[styles.bottomText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
              Claims today: 0/1 · This week: 1/3
            </Text>
          </View>
        </View>
      </ScrollView>

      <VerifyPickupModal
        visible={showVerifyPickupModal}
        onClose={closeVerifyPickupModal}
        onVerify={handleVerifyPickup}
      />
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
  imageWrap: {
    width: '100%',
    height: 240,
   
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingTop: 16,
  },
  title: {
    marginBottom: 12,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {},
  providerTextWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  providerLabel: {},
  providerName: {},
  pickupDetailsWrap: {
    marginBottom: 20,
  },
  navigateShareBar: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  foodTypeText: {
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  dietaryTagText: {},
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,

    
   
  },
  quantityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  quantityNum: {},
  quantityLabel: {},
  allergenCard: {
    padding: 20,
    borderRadius: 12,
    
  },
  allergenHeader: {
    
    gap: 8,

  },
  allergenIconWrap:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    
  },
  allergenTitle: {},
  allergenTags: {
    flexDirection: 'row',
    
    gap: 8,
    marginLeft: 28,
  },
  allergenTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
   
  },
  allergenTagText: {},
  instructionsBox: {
    paddingVertical: 25,
    borderRadius: 10,
    borderWidth: 1,
    
    paddingHorizontal: 16,
  },
  instructionsText: {},
  requestBtn: {
    marginTop: 8,
  },
  requestSubmittedBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 120,
    gap: 8,
  },
  requestSubmittedText: {},
  pinQrRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  pinQrBtn: {
    flex: 1,
  },
  bottomContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  bottomText: {},
});

export default FoodDetailScreen;
