import React, { useRef, useState } from 'react'
import { StyleSheet, Text, View, Image, FlatList, Dimensions, ImageSourcePropType } from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { getColors, palette } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigations/RootNavigation'
import ContinueButton from '../components/ContinueButton'

const { width, height } = Dimensions.get('window')
const IMAGE_HEIGHT = height * 0.70

type Slide = {
  title: string
  subtitle: string
  image: ImageSourcePropType
}

/** First flow after splash: 3 slides then SelectRoleScreen (provider vs recipient). */
const data: Slide[] = [
  {
    title: 'Reduce Food Waste',
    subtitle: 'Surplus food can feed real people nearby.',
    image: require('../assets/images/OnbardingImage1.png'),
  },
  {
    title: 'Fast & Fair Distribution',
    subtitle: 'Smart matching ensures food reaches those who need it most.',
    image: require('../assets/images/OnbardingImage2.png'),
  },
  {
    title: 'Safe Pickups',
    subtitle: 'Secure pickup with PIN & QR Code verification.',
    image: require('../assets/images/OnbardingImage3.png'),
  }
]

export default function OnBoardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
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
      navigation.replace('SelectRoleScreen')
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
            resizeMode="contain"
            style={[
              styles.image,
              { height: IMAGE_HEIGHT, width: undefined, aspectRatio: 1, borderRadius: 24 },
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
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fontFamilies.inter,
              fontSize: fontSizes.subhead,
              textAlign: 'center',
              marginTop: 5,
              lineHeight: 22,
            }}>
            {item.subtitle}
          </Text>
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
    width: width - 32,
    
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    
  },
  bottomCard: {
    width: width - 32,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 24,
    marginTop:10
    
    
  },
  dots: {
   marginTop:16,
    flexDirection: 'row',
    justifyContent: 'center',
    
  },
  dot: {
    height: 8,
    borderRadius: 999,
    marginHorizontal: 2,
  },
})
