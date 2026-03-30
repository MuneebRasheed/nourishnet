import React, { useRef, useState } from 'react'
import { StyleSheet, Text, View, Image, FlatList, Dimensions, ImageSourcePropType } from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { getColors } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigations/RootNavigation'
import ContinueButton from '../components/ContinueButton'
import TickGreen from '../assets/svgs/TickGreen'

const { width } = Dimensions.get('window')
const IMAGE_HEIGHT = 520

type Slide = {
  title: string
  subtitle?: string
  image: ImageSourcePropType
  bulletPoints?: string[]
}

const data: Slide[] = [
  {
    title: 'Post surplus in under 60 seconds.',
    subtitle: 'Nearby users are notified instantly. No coordination required.',
    image: require('../assets/images/FoodOnboard1.png'),
  },
  {
    title: 'You stay in control',
    image: require('../assets/images/FoodOnboard2.png'),
    bulletPoints: [
      'Set pickup window',
      'Secure PIN verification',
      'No public sharing of address until claimed',
    ],
  },
  {
    title: 'Simple. Safe. Sustainable.',
    image: require('../assets/images/FoodOnboard3.png'),
    bulletPoints: [
      'Easy pickup with verified PIN',
      'Fair allocation for everyone',
      'Your data stays private',
    ],
  },
]

export default function FoodOnBoardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'FoodOnBoardScreen'>>()
  const role = route.params?.role ?? 'provider'
  const intent = route.params?.intent ?? 'login'
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'
  const colors = getColors(isDark)
  const fontSizes = useAppFontSizes()
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<Slide>>(null)

  const isLast = index === data.length - 1
  const buttonLabel = isLast ? 'Get Started' : 'Continue'

  const onContinue = () => {
    if (isLast) {
      navigation.navigate(intent === 'signup' ? 'SignupScreen' : 'LoginScreen', { role })
    } else {
      const next = index + 1
      listRef.current?.scrollToIndex({ index: next, animated: true })
      setIndex(next)
    }
  }

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.imageWrap}>
          <Image
            source={item.image}
            resizeMode="cover"
            style={[
              styles.image,
              { height: IMAGE_HEIGHT, width: width, borderRadius: 24 },
            ]}
          />
        </View>

        {/* Pagination Dots */}
        <View style={styles.dots}>
          {data.map((_, i) => {
            const active = i === index
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: active ? colors.primary : colors.primary,
                    opacity: active ? 1 : 0.4,
                    width: active ? 24 : 8,
                  },
                ]}
              />
            )
          })}
        </View>
        <View style={[styles.bottomCard, { backgroundColor: colors.background }]}>
          <Text
            style={{
              color: colors.text,
              fontFamily: fontFamilies.poppinsSemiBold,
              fontSize: fontSizes.largeTitle,
              textAlign: 'center',
            }}
          >
            {item.title}
          </Text>
          {item.subtitle ? (
            <View style={styles.subtitleContainer}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fontSizes.subhead,
                  textAlign: 'center',
                  marginTop: 5,
                  lineHeight: 22,
                }}
              >
                {item.subtitle}
              </Text>
            </View>
          ) : null}
          {item.bulletPoints && item.bulletPoints.length > 0 ? (
            <View style={styles.bulletList}>
              {item.bulletPoints.map((point, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.tickWrap}>
                    <TickGreen width={20} height={20} />
                  </View>
                  <Text
                    style={[
                      styles.bulletText,
                      {
                        color: colors.textSecondary,
                        fontFamily: fontFamilies.inter,
                        fontSize: fontSizes.body,
                      },
                    ]}
                  >
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, i) => `${item.title}-${i}`}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width)
          setIndex(newIndex)
        }}
      />

      {/* Continue / Get Started Button */}
      <ContinueButton
        label={buttonLabel}
        onPress={onContinue}
        isDark={isDark}
        style={{ position: 'absolute', bottom: 48, left: 16, right: 16 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
  },
  imageWrap: {
    width: width,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
  bottomCard: {
    width: width - 32,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
  },
  dots: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  bulletList: {
    marginTop: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tickWrap: {
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
  },
})
