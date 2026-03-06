import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import RoleBulb from '../assets/svgs/RoleBulb'
import { fontFamilies } from '../../theme/typography'
import { useAppFontSizes } from '../../theme/fonts'
import { getColors, palette } from '../../utils/colors'
import { useThemeStore } from '../../store/themeStore'

export type RoleCardProps = {
  title: string
  description: string
  iconColor?: string
  iconBackgroundColor?: string
  iconWrapperBackgroundColor?: string
  onPress: () => void
}

const RoleCard = ({
  title,
  description,
  iconColor,
  iconBackgroundColor,
  iconWrapperBackgroundColor,
  onPress,
}: RoleCardProps) => {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()

  const bg = iconBackgroundColor ?? colors.surfaceBorder
  const iconWrapperBg =
    iconWrapperBackgroundColor ?? (isDark ? colors.inputFieldBg : bg)

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? colors.inputFieldBg : bg,borderColor:colors.borderColor,borderWidth:1 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconWrapperBg }]}>
        <RoleBulb color={iconColor} width={40} height={40} />
      </View>
      <View style={{marginHorizontal:40}}>

     
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontFamily: fontFamilies.poppinsSemiBold,
            fontSize: fonts.largeTitle,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            fontFamily: fontFamilies.inter,
            fontSize: fonts.subhead,
          },
        ]}
      >
        {description}
      </Text>
      </View>
    </TouchableOpacity>
  )
}

export default RoleCard

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
 
    
  },
  iconWrapper: {
    
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    padding:20
    

  },
  title: {
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
})
