import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import CloseIcon from '../assets/svgs/CloseIcon';
import FlashIcon from '../assets/svgs/FlashIcon';
import { fontFamilies } from '../../theme/typography';
import { useAppFontSizes } from '../../theme/fonts';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import type { RootStackParamList } from '../navigations/RootNavigation';
import { generatePickupPinApi, verifyPickupPinApi } from '../lib/api/listings';
import { PickupVerifiedModal } from '../components/PickupVerifiedModal';

const FRAME_SIZE = 260;
const CORNER_LENGTH = 40;
const CORNER_WIDTH = 4;
const SCAN_LINE_HEIGHT = 2;

function QRCodeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'QRCodeScreen'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'QRCodeScreen'>>();
  const listingIdFromRoute = route.params?.listingId;
  const recipientIdFromRoute = route.params?.recipientId;
  const mode = route.params?.mode ?? 'scan';
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const [pin, setPin] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [showPickupVerifiedModal, setShowPickupVerifiedModal] = useState(false);

  useEffect(() => {
    if (mode !== 'scan') return;
    if (!permission?.granted) {
      requestPermission();
    }
  }, [mode, permission?.granted, requestPermission]);

  useEffect(() => {
    if (mode !== 'show') return;
    if (!listingIdFromRoute) return;
    let cancelled = false;

    (async () => {
      setPinLoading(true);
      const { pin: newPin, error } = await generatePickupPinApi(listingIdFromRoute, recipientIdFromRoute);
      if (cancelled) return;
      if (error || !newPin) {
        setPinLoading(false);
        Alert.alert('Unable to generate PIN', error ?? 'Please try again.');
        return;
      }
      setPin(newPin);
      setPinLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [listingIdFromRoute, mode, recipientIdFromRoute]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - SCAN_LINE_HEIGHT],
  });

  const qrValue = useMemo(() => {
    if (!listingIdFromRoute || !pin) return '';
    return JSON.stringify({ listingId: listingIdFromRoute, pin });
  }, [listingIdFromRoute, pin]);

  function parseQrPayload(raw: string): { listingId?: string; pin?: string } {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) return {};

    // Accept raw pin only (e.g. "1234" or "123456")
    if (/^\d{4,8}$/.test(trimmed)) return { pin: trimmed };

    // Accept URL payloads: nourishnet://pickup?listingId=...&pin=....
    try {
      // eslint-disable-next-line no-new
      const url = new URL(trimmed);
      const pin = url.searchParams.get('pin') ?? undefined;
      const listingId = url.searchParams.get('listingId') ?? url.searchParams.get('listing_id') ?? undefined;
      if (pin || listingId) return { pin: pin?.trim(), listingId: listingId?.trim() };
    } catch {
      // ignore
    }

    // Accept JSON: {"listingId":"...","pin":"1234"} or {"listing_id":"...","pin":"1234"}
    try {
      const obj = JSON.parse(trimmed) as any;
      const pin = typeof obj?.pin === 'string' ? obj.pin : undefined;
      const listingId =
        typeof obj?.listingId === 'string'
          ? obj.listingId
          : typeof obj?.listing_id === 'string'
            ? obj.listing_id
            : undefined;
      return { pin: pin?.trim(), listingId: listingId?.trim() };
    } catch {
      // ignore
    }

    return {};
  }

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    const parsed = parseQrPayload(data);
    const pin = parsed.pin;
    const listingId = parsed.listingId ?? listingIdFromRoute;

    if (!listingId) {
      Alert.alert('Missing listing', 'This QR scan is missing a listing id.');
      setScanned(false);
      return;
    }
    if (!pin) {
      Alert.alert('Invalid QR code', 'Could not read a pickup PIN from this QR code.');
      setScanned(false);
      return;
    }

    const { error } = await verifyPickupPinApi(listingId, pin);
    if (error) {
      Alert.alert('Verification failed', error);
      setScanned(false);
      return;
    }

    setShowPickupVerifiedModal(true);
  };

  const closePickupVerifiedModal = () => {
    setShowPickupVerifiedModal(false);
    navigation.goBack();
  };

  if (mode === 'show') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <CloseIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <FlashIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <View style={[styles.showWrap, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={[styles.showTitle, { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body }]}>
            Show this QR at pickup
          </Text>
          <Text style={[styles.showSubtitle, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.subhead }]}>
            Recipient scans to verify pickup
          </Text>

          <View style={[styles.qrCard, { backgroundColor: palette.white, borderColor: colors.borderColor }]}>
            {pinLoading ? (
              <Text style={[styles.loadingText, { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.body }]}>
                Generating QR...
              </Text>
            ) : pin ? (
              <QRCode value={qrValue} size={240} />
            ) : (
              <Text style={[styles.loadingText, { color: colors.textSecondary ?? colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.body }]}>
                Unable to generate QR.
              </Text>
            )}
          </View>

          {/* {pin ? (
            <View style={styles.pinRow}>
              <Text style={[styles.pinLabel, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
                Backup PIN
              </Text>
              <Text style={[styles.pinValue, { color: colors.text, fontFamily: fontFamilies.interBold, fontSize: fonts.largeTitle }]}>
                {pin}
              </Text>
            </View>
          ) : null} */}

          <Text style={[styles.showHint, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
            Keep this code private. Generate it only when the recipient arrives.
          </Text>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Camera access is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          enableTorch={torchOn}
        />
        {/* Overlay */}
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <CloseIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setTorchOn((v) => !v)}
            activeOpacity={0.8}
          >
            <FlashIcon width={24} height={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.frameContainer} pointerEvents="none">
          <View style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            <Animated.View
              style={[
                styles.scanLine,
                { backgroundColor: colors.primary, transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={[styles.instruction, { color: palette.white, fontSize: fonts.body }]}>Position QR in the frame</Text>
          <Text style={[styles.attribution, { color: colors.textSecondary, fontSize: fonts.subhead }]}>Scanning by NourishNet</Text>
        </View>
      </View>
      <PickupVerifiedModal
        visible={showPickupVerifiedModal}
        onClose={closePickupVerifiedModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LENGTH,
    height: CORNER_LENGTH,
    borderColor: '#fff',
    borderLeftWidth: CORNER_WIDTH,
    borderTopWidth: CORNER_WIDTH,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: CORNER_WIDTH,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderBottomWidth: CORNER_WIDTH,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: CORNER_WIDTH,
    borderBottomWidth: CORNER_WIDTH,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCAN_LINE_HEIGHT,
    top: 0,
    borderRadius: SCAN_LINE_HEIGHT / 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  instruction: {
    fontFamily: fontFamilies.inter,
    fontSize: 17,
   
    marginBottom: 8,
  },
  attribution: {
    fontFamily: fontFamilies.inter,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  message: {
    fontFamily: fontFamilies.inter,
   
    textAlign: 'center',
  },
  showWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  showTitle: {
    marginTop: 8,
  },
  showSubtitle: {
    marginBottom: 10,
    textAlign: 'center',
  },
  qrCard: {
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  pinRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  pinLabel: {},
  pinValue: {
    letterSpacing: 2,
  },
  showHint: {
    marginTop: 8,
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#34C759',
    borderRadius: 8,
  },
  permissionBtnText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 16,
    color: '#fff',
  },
});

export default QRCodeScreen;
