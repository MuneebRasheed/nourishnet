import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
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

export type PickupPinModalProps = {
  visible: boolean;
  pin: string | null;
  onClose: () => void;
};

export function PickupPinModal({ visible, pin, onClose }: PickupPinModalProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(10);
      return;
    }

    setSecondsLeft(10);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, onClose]);

  if (!visible) return null;

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
            Pickup PIN
          </Text>
          <Text
            style={[
              styles.modalInstruction,
              {
                color: colors.textSecondary ?? colors.text,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
              },
            ]}
          >
            Show this PIN to the recipient at pickup:
          </Text>
          {pin != null && pin !== '' && (
            <Text
              style={[
                styles.pinDisplay,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.interBold,
                  fontSize: fonts.largeTitle,
                },
              ]}
            >
              {pin}
            </Text>
          )}
          <Text
            style={[
              styles.modalWarning,
              {
                color: colors.textSecondary ?? colors.text,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.caption,
              },
            ]}
          >
            This PIN may only be shown once and will hide in {secondsLeft}s.
          </Text>
          <ContinueButton
            label="OK"
            onPress={onClose}
            isDark={isDark}
            backgroundColor={colors.primary}
            textColor={palette.white}
            style={styles.modalOkBtn}
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
    marginBottom: 16,
    lineHeight: 22,
  },
  pinDisplay: {
    marginBottom: 16,
    letterSpacing: 4,
  },
  modalWarning: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalOkBtn: {
    width: '100%',
  },
});
