import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { getColors } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'

type Props = {
  label?: string
  containerStyle?: ViewStyle
  textStyle?: TextStyle
}

export default function AuthSeparator({ label , containerStyle, textStyle }: Props) {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()

  return (
    <View style={[styles.separator, containerStyle]}>
      <View style={[styles.line, { backgroundColor: colors.borderColor }]} />
      <Text
        style={[
          styles.text,
          {
            color: colors.textSecondary,
            fontFamily: fontFamilies.interMedium,
            fontSize: fonts.subhead,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
      <View style={[styles.line, { backgroundColor: colors.borderColor }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  line: {
    height: 1,
    flex: 1,
  },
  text: {
    marginHorizontal: 12,
  },
})
