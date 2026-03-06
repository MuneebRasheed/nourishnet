import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import ContinueButton from './ContinueButton';
import { BlurView } from 'expo-blur';

const PIN_LENGTH = 4;

export type VerifyPickupModalProps = {
  visible: boolean;
  onClose: () => void;
  onVerify: (pin: string) => void;
};

export function VerifyPickupModal({ visible, onClose, onVerify }: VerifyPickupModalProps) {
  const [pinDigits, setPinDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const pinInputRefs = useRef<(TextInput | null)[]>([]);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  useEffect(() => {
    if (visible) {
      setPinDigits(Array(PIN_LENGTH).fill(''));
    }
  }, [visible]);

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...pinDigits];
    next[index] = digit;
    setPinDigits(next);
    if (digit && index < PIN_LENGTH - 1) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const pin = pinDigits.join('');
    if (pin.length !== PIN_LENGTH) return;
    onVerify(pin);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalBlurContainer} pointerEvents="none">
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={10}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.modalAndroidOverlay]} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.modalOverlayBg]} />
        </View>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.inputFieldBg }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[
              styles.modalTitle,
              {
                color: colors.primary,
                fontFamily: fontFamilies.poppinsSemiBold,
                fontSize: fonts.largeTitle,
              },
            ]}
          >
            Verify Pickup
          </Text>
          <Text
            style={[
              styles.modalInstruction,
              {
                color: colors.text,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
              },
            ]}
          >
            Ask the provider for their{' '}
            <Text style={{ fontFamily: fontFamilies.interSemiBold }}>4-digit PIN</Text> and enter it
            below to confirm your pickup.
          </Text>
          <View style={styles.pinRow}>
            {pinDigits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  pinInputRefs.current[index] = el;
                }}
                style={[
                  styles.pinInput,
                  {
                    color: colors.text,
                    fontFamily: fontFamilies.interBold,
                    fontSize: fonts.title,
                    backgroundColor: colors.inputFieldBg,
                    borderColor: colors.borderColor,
                  },
                ]}
                value={digit}
                onChangeText={(v) => handlePinChange(index, v)}
                onKeyPress={({ nativeEvent }) => handlePinKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                selectionColor={colors.primary}
                cursorColor={colors.primary}
              />
            ))}
          </View>
          <ContinueButton
            label="Verify Pickup"
            onPress={handleVerify}
            isDark={isDark}
            backgroundColor={colors.primary}
            textColor={palette.white}
            style={styles.modalVerifyBtn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBlurContainer: {
    ...StyleSheet.absoluteFillObject,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalAndroidOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalOverlayBg: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: 12,
  },
  modalInstruction: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInput: {
    width: 58,
    height: 52,
    borderRadius: 12,
    textAlign: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  modalVerifyBtn: {
    width: '100%',
  },
});
