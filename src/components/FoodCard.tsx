import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import TimerIcon from '../assets/svgs/TimerIcon';
import FillArrow from '../assets/svgs/FillArrow';
import ContinueButton from './ContinueButton';

export interface FoodCardData {
  id: string;
  image: ImageSourcePropType;
  title: string;
  source: string;
  distance: string;
  postedAgo: string;
  portions: string;
  timeSlot: string;
  dietaryTags?: string[];
  isLive?: boolean;
}

interface FoodCardProps {
  item: FoodCardData;
  onClaim?: () => void;
  /** Button label; default "Claim This Food" */
  claimLabel?: string;
  /** 'primary' = green filled (default), 'outline' = white with border + icon */
  claimButtonVariant?: 'primary' | 'outline';
  /** Outline variant only: custom button background */
  claimButtonBgColor?: string;
  /** Outline variant only: custom button border */
  claimButtonBorderColor?: string;
  /** Outline variant only: custom button text */
  claimButtonTextColor?: string;
  /** Outline variant only: custom icon color */
  claimIconColor?: string;
  /** Outline variant only: 'arrow' = FillArrow (e.g. Navigate), 'timer' = TimerIcon (e.g. Request Submitted) */
  claimIconType?: 'arrow' | 'timer';
  /** When set with outline variant, show a second "View Detail" button below Request Submitted */
  viewDetailLabel?: string;
  onViewDetail?: () => void;
}

export default function FoodCard({
  item,
  onClaim,
  claimLabel = 'Request This Food',
  claimButtonVariant = 'primary',
  claimButtonBgColor,
  claimButtonBorderColor,
  claimButtonTextColor,
  claimIconColor,
  claimIconType = 'timer',
  viewDetailLabel,
  onViewDetail,
}: FoodCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  return (
    <View style={[styles.card, { backgroundColor: colors.inputFieldBg, borderColor: colors.border }]}>
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        {item.isLive !== false && (
          <View style={[styles.liveBadge, { backgroundColor: palette.liveTextbg }]}>
            <Text style={[styles.liveText, { fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>Live</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleWrap}>
          <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
            style={[
              styles.posted,
              { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.caption-2 },
            ]}
          >
            Posted {item.postedAgo}
          </Text>
          </View>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.source,
              { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
            ]}
          >
            {item.source} • {item.distance}
          </Text>
         
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
              {item.portions}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption }]}>
              {item.timeSlot}
            </Text>
          </View>
        </View>
        {item.dietaryTags && item.dietaryTags.length > 0 && (
          <View style={styles.tags}>
            {item.dietaryTags.map((tag) => (
              <View key={tag} style={[styles.tag, { borderColor: colors.glutenBorder }]}>
                <Text style={[styles.tagText, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
        {claimButtonVariant === 'outline' && onViewDetail != null ? (
          <View style={styles.twoButtonRow}>
            <View
              style={[
                styles.requestSubmittedPill,
                {
                  backgroundColor: claimButtonBgColor ?? colors.inputFieldBg,
                },
              ]}
            >
              <TimerIcon
                width={18}
                height={18}
                color={claimIconColor ?? colors.textSecondary}
              />
              <Text
                style={[
                  styles.requestSubmittedPillText,
                  {
                    color: claimButtonTextColor ?? colors.textSecondary,
                    fontFamily: fontFamilies.interMedium,
                    fontSize: fonts.caption,
                  },
                ]}
                numberOfLines={1}
              >
                {claimLabel}
              </Text>
            </View>
            <View style={styles.viewDetailBtnWrap}>
              <ContinueButton
                label={viewDetailLabel ?? 'View Detail'}
                onPress={onViewDetail}
                isDark={isDark}
                backgroundColor={colors.primary}
                textColor={palette.white}
                icon={<FillArrow width={18} height={18} color={palette.white} />}
                iconPosition="left"
                style={styles.viewDetailBtn}
              />
            </View>
          </View>
        ) : (
          <ContinueButton
            label={claimLabel}
            onPress={() => onClaim?.()}
            isDark={isDark}
            backgroundColor={
              claimButtonVariant === 'outline'
                ? (claimButtonBgColor ?? palette.white)
                : undefined
            }
            textColor={
              claimButtonVariant === 'outline'
                ? (claimButtonTextColor ?? colors.text)
                : undefined
            }
            borderColor={
              claimButtonVariant === 'outline'
                ? (claimButtonBorderColor ?? colors.border)
                : undefined
            }
            icon={
              claimButtonVariant === 'outline' ? (
                claimIconType === 'arrow' ? (
                  <FillArrow
                    width={20}
                    height={20}
                    color={isDark ? palette.white : colors.text}
                  />
                ) : (
                  <TimerIcon
                    width={20}
                    height={20}
                    color={claimIconColor ?? colors.text}
                  />
                )
              ) : undefined
            }
            iconPosition="left"
            style={styles.claimBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    
    marginBottom: 16,
    padding:12,
  },
  imageWrap: {
    width: '100%',
    height: 136,
    
   
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    color: palette.roleBulbColor2,
  },
  body: {
    padding: 12,
 
  },
  titleWrap:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
  },
  title: {},
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  source: {},
  posted: {marginLeft: 5},
  detailsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {},
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  tagText: {},
  claimBtn: {
    marginTop: 14,
  },
  twoButtonRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    height: 48,
  },
  requestSubmittedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 100,
    gap: 6,
  },
  requestSubmittedPillText: {},
  viewDetailBtnWrap: {
    flex: 1,
  },
  viewDetailBtn: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 12,
  },
});
