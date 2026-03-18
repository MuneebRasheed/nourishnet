import React from 'react';
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

export type PickupVerifiedModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PickupVerifiedModal({ visible, onClose }: PickupVerifiedModalProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

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
            Pickup verified
          </Text>
          <Text
            style={[
              styles.modalMessage,
              {
                color: colors.textSecondary ?? colors.text,
                fontFamily: fontFamilies.inter,
                fontSize: fonts.subhead,
              },
            ]}
          >
            Thanks! Your pickup has been confirmed.
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
  modalMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalOkBtn: {
    width: '100%',
  },
});
