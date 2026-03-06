import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import CloseIcon from '../assets/svgs/CloseIcon';
import FlashIcon from '../assets/svgs/FlashIcon';
import { fontFamilies } from '../../theme/typography';
import { useAppFontSizes } from '../../theme/fonts';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';

const FRAME_SIZE = 260;
const CORNER_LENGTH = 40;
const CORNER_WIDTH = 4;
const SCAN_LINE_HEIGHT = 2;

function QRCodeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

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

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    // TODO: handle scanned data (e.g. verify pickup, navigate back with result)
    navigation.goBack();
  };

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
        <Text style={[styles.instruction, { color:palette.white, fontSize: fonts.body }]}>Position QR in the frame</Text>
        <Text style={[styles.attribution, { color: colors.textSecondary, fontSize: fonts.subhead }]}>Scanning by NourishNet</Text>
      </View>
    </View>
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
