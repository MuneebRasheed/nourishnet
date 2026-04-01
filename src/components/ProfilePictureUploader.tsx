import React from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { avatarUriWithCacheBust } from '../lib/profile'
import { getColors, palette } from '../../utils/colors'
import { useAppFontSizes } from '../../theme/fonts'
import { fontFamilies } from '../../theme/typography'
import Camera from '../assets/svgs/Camera'
import Partner from '../assets/svgs/Partner'
import ProfileFood from '../assets/svgs/ProfileFood'

type ProfilePictureUploaderProps = {
  imageUri?: string | null
  /** For remote avatars, e.g. profile.updated_at — avoids stale Image cache when URL path is unchanged. */
  imageCacheKey?: string | null
  onPress?: () => void
  PlaceholderIcon?: React.ComponentType<any>
}

const AVATAR_SIZE = 140
const CAMERA_BADGE_SIZE = 50

export function ProfilePictureUploader({
  imageUri,
  imageCacheKey,
  onPress,
  PlaceholderIcon,
}: ProfilePictureUploaderProps) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const userRole = useAuthStore((s) => s.userRole)
  const colors = getColors(isDark)
  const fontSizes = useAppFontSizes()
  const resolvedUri = avatarUriWithCacheBust(imageUri ?? undefined, imageCacheKey) ?? imageUri ?? undefined

  const IconComponent =
    PlaceholderIcon ??
    (userRole === 'provider'
      ? ProfileFood
      : Partner)

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.avatarRing,
          {
            backgroundColor: colors.background,
            borderColor: colors.inputFieldBg,
           
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        {resolvedUri ? (
          <Image
            source={{ uri: resolvedUri }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <IconComponent
            width={64}
            height={64}
            style={{ opacity: 0.8 }}
            color={isDark ? palette.white : palette.black}
          />
        )}
        <View
          style={[
            styles.cameraBadge,
            { backgroundColor: colors.primary , borderColor: "white",},
          ]}
        >
          <Camera width={20} height={20} />
        </View>
      </Pressable>
      <Text
        style={[
          styles.hint,
          {
            color: colors.textSecondary,
            fontFamily: fontFamilies.inter,
            fontSize: fontSizes.subhead,
          },
        ]}
      >
        Tap to upload profile photo
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 24,
   
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor:"green",
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  cameraBadge: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: CAMERA_BADGE_SIZE,
    height: CAMERA_BADGE_SIZE,
    borderRadius: CAMERA_BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
   
  },
  hint: {
    marginTop: 12,
  },
})
