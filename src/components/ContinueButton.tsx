import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  isDark?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  activeOpacity?: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;

  // ✅ New props
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}

const ContinueButton: React.FC<CustomButtonProps> = ({
  label,
  onPress,
  isDark = false,
  style,
  textStyle,
  activeOpacity = 0.9,
  backgroundColor,
  borderColor,
  textColor,
  icon,
  iconPosition = 'left',
  disabled = false,
}) => {
  const colors = getColors(isDark);
  const fontSizes = useAppFontSizes();
  const resolvedBackgroundColor = backgroundColor ?? colors.primary;
  const resolvedTextColor = textColor ?? palette.white;
  const borderStyle = borderColor
    ? { borderColor, borderWidth: 1 }
    : undefined;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: resolvedBackgroundColor, opacity: disabled ? 0.55 : 1 },
        borderStyle,
        style,
      ]}
      activeOpacity={activeOpacity}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}

        <Text
          style={[
            styles.text,
            {
              color: resolvedTextColor,
              fontFamily: fontFamilies.interBold,
              fontSize: fontSizes.body,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>

        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default ContinueButton;
