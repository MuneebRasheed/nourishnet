import { StyleSheet, Text, View, ScrollView } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeStore } from '../../store/themeStore'
import { getColors, palette } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import SplashIcon from '../assets/svgs/SplashIcon'
import RoleBulb from '../assets/svgs/RoleBulb'
import HandLogo from '../assets/svgs/HandLogo'
import RoleCard from '../components/RoleCard'
import { RootStackParamList } from '../navigations/RootNavigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { useRoute, RouteProp } from '@react-navigation/native'

const SelectRoleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'SelectRoleScreen'>>()
  const intent = route.params?.intent ?? 'login'
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fonts = useAppFontSizes()
  const insets = useSafeAreaInsets()

  const handleFoodProvider = () => {
    navigation.navigate('FoodOnBoardScreen', { role: 'provider', intent })
  }

  const handleFoodRecipient = () => {
    navigation.navigate('ReceiptOnBoardScreen', { role: 'recipient', intent })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <SplashIcon width={66} height={62} style={styles.logo} />

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
            How will you use {"\n"}NourishNet?
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.poppins,
                fontSize: fonts.body,
              },
            ]}
          >
            Choose your role to get started
          </Text>

          {/* Two flows: provider (FoodOnBoard → Login → MainTabs provider tabs) and recipient (ReceiptOnBoard → Login → MainTabs recipient tabs) */}
          <View style={styles.cards}>
            <RoleCard
              title="Food Provider"
              description="Share surplus food from your restaurant, bakery, or home with those in need"
              iconColor={isDark ? palette.roleBulbColor3 : palette.roleBulbColor1}
              icon={
                <RoleBulb
                  color={isDark ? palette.roleBulbColor3 : palette.roleBulbColor1}
                  width={40}
                  height={40}
                />
              }
              iconBackgroundColor={isDark ? colors.surfaceBorder : palette.white}
              iconWrapperBackgroundColor={isDark ? colors.inputFieldBg : palette.roleCardbg}
              onPress={handleFoodProvider}
            />
            <RoleCard
              title="Food Recipient"
              description="Find nutritious food available near you and connect with your community"
              iconColor={isDark ? palette.roleBulbColor4 : palette.roleBulbColor2}
              icon={
                <HandLogo
                  color={isDark ? palette.roleBulbColor4 : palette.roleBulbColor2}
                  width={40}
                  height={40}
                />
              }
              iconBackgroundColor={isDark ? colors.surfaceBorder : palette.white}
              iconWrapperBackgroundColor={isDark ? colors.inputFieldBg : palette.roleCard}
              onPress={handleFoodRecipient}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default SelectRoleScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
   
  },
  logo: {
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 32,
    
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  cards: {
    marginTop: 32,
  },
})
