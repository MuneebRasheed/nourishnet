import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import { getColors, palette } from '../../utils/colors'
import Feather from '@expo/vector-icons/Feather'
import EyeIcon from '../assets/svgs/EyeIcon'
export type AuthInputType = 'email' | 'password' | 'text'
export type AuthInputIconPosition = 'left' | 'right' | 'none'

export type AuthInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  type: AuthInputType
  label?: string
  placeholder?: string
  iconPosition?: AuthInputIconPosition
  containerStyle?: ViewStyle
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  inputFieldBg?: string
  showPasswordToggle?: boolean
  toggleVisibilityOnLeftIconPress?: boolean
}

const config = {
  email: {
    label: 'Email',
    placeholder: 'John@gmail.com',
    keyboardType: 'email-address' as const,
    autoCapitalize: 'none' as const,
    autoCorrect: false,
  },
  text: {
    label: 'Label',
    placeholder: '',
  },
  password: {
    label: 'Password',
    placeholder: '••••••••',
    secureTextEntry: true,
  },
}

export function AuthInput({
  type,
  label,
  placeholder: placeholderProp,
  iconPosition = 'left',
  containerStyle,
  leftIcon,
  rightIcon,
  inputFieldBg,
  showPasswordToggle = true,
  toggleVisibilityOnLeftIconPress = false,
  style,
  placeholderTextColor: placeholderTextColorProp,
  ...inputProps
}: AuthInputProps) {
  const { label: defaultLabel, placeholder: defaultPlaceholder, ...typeProps } = config[type]
  const fontSizes = useAppFontSizes()
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const colors = getColors(isDark)
  const displayLabel = label ?? defaultLabel
  const placeholder = placeholderProp ?? defaultPlaceholder
  const isPassword = type === 'password'

  const textColor = isDark ? palette.white : colors.text
  const placeholderColor = placeholderTextColorProp ?? colors.textSecondary
  const inputBg = inputFieldBg ?? colors.inputFieldBg
  

  const [passwordVisible, setPasswordVisible] = useState(false)
  const secureTextEntry = isPassword ? !passwordVisible : false
  const showEye = isPassword && showPasswordToggle && !toggleVisibilityOnLeftIconPress
  const leftIconIsToggle = isPassword && toggleVisibilityOnLeftIconPress && leftIcon != null

  const eyeToggleNode = showEye ? (
      <Pressable
      onPress={() => setPasswordVisible((v) => !v)}
      style={styles.eyeToggle}
      hitSlop={8}
    >
      {passwordVisible ? (
        <Feather name="eye-off" size={18} color={textColor}
        />
      ) : (
        <EyeIcon width={20} height={20} color={textColor} />
      )}
    </Pressable>
  ) : null

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.label,
          {
            fontFamily: fontFamilies.interMedium,
            fontSize: fontSizes.subhead,
            color: textColor,
          },
        ]}
      >
        {displayLabel}
      </Text>
      <View style={[styles.inputRow, { backgroundColor: inputBg }]}>
        {leftIcon ? (
          <View style={styles.iconWrapLeft}>
            {leftIconIsToggle ? (
              <Pressable
                onPress={() => setPasswordVisible((v) => !v)}
                style={styles.leftIconPressable}
                hitSlop={8}
              >
                {leftIcon}
              </Pressable>
            ) : (
              leftIcon
            )}
          </View>
        ) : null}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithIconLeft : styles.inputNoIcon,
            (showEye || rightIcon) && styles.inputWithEyeToggle,
            { fontSize: fontSizes.subhead, color: textColor },
            style,
          ]}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          {...typeProps}
          {...inputProps}
          secureTextEntry={secureTextEntry}
        />
        {rightIcon ? (
          <View style={styles.iconWrapRight}>
            {rightIcon}
          </View>
        ) : null}
        {eyeToggleNode}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: fontFamilies.interMedium,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    
  },
  iconWrapLeft: {
    paddingLeft: 16,
    justifyContent: 'center',
  },
  leftIconPressable: {
    justifyContent: 'center',
  },
  iconWrapRight: {
    paddingRight: 16,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: fontFamilies.inter,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  inputWithIconLeft: {
    paddingLeft: 10,
  },
  inputWithIconRight: {
    paddingRight: 10,
  },
  inputNoIcon: {
    paddingHorizontal: 16,
  },
  inputWithEyeToggle: {
    paddingRight: 10,
  },
  eyeToggle: {
    paddingRight: 16,
    paddingLeft: 8,
    justifyContent: 'center',
  },
})
