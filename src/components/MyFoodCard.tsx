import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import ContinueButton from './ContinueButton';

export type RequestStatus = 'waiting_approval' | 'ready_for_pickup';

export type MyFoodItem = {
  id: string;
  image: ImageSourcePropType;
  title: string;
  source: string;
  distance: string;
  postedAgo: string;
  portions: string;
  timeSlot: string;
  dietaryTags?: string[];
  status: RequestStatus;
};

interface MyFoodCardProps {
  item: MyFoodItem;
  onViewStatus: () => void;
  onNavigate: () => void;
}

export default function MyFoodCard({ item, onViewStatus, onNavigate }: MyFoodCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const isReady = item.status === 'ready_for_pickup';
  const statusLabel = isReady ? 'Ready for pickup' : 'Waiting approval';
  const statusBg = isReady ? colors.primary : '#FEE685';

  return (
    <View style={[styles.card, { backgroundColor: colors.inputFieldBg, borderColor: colors.border }]}>
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text
            style={[
              styles.statusText,
              {
                color: isReady ? palette.white : colors.text,
                fontFamily: fontFamilies.interMedium,
                fontSize: fonts.caption,
              },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
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
              { color: colors.text, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
            ]}
          >
            Posted {item.postedAgo}
          </Text>
        </View>
        <Text
          style={[
            styles.source,
            { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
          ]}
        >
          {item.source} • {item.distance}
        </Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text
              style={[
                styles.detailText,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.caption,
                },
              ]}
            >
              {item.portions}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text
              style={[
                styles.detailText,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.caption,
                },
              ]}
            >
              {item.timeSlot}
            </Text>
          </View>
        </View>
        {item.dietaryTags && item.dietaryTags.length > 0 && (
          <View style={styles.tags}>
            {item.dietaryTags.map((tag) => (
              <View key={tag} style={[styles.tag, { borderColor: colors.glutenBorder }]}>
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: colors.text,
                      fontFamily: fontFamilies.interMedium,
                      fontSize: fonts.caption,
                    },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
        {isReady ? (
          <ContinueButton
            label="Navigate to Pickup"
            onPress={onNavigate}
            isDark={isDark}
            style={styles.actionBtn}
          />
        ) : (
          <ContinueButton
            label="View Status"
            onPress={onViewStatus}
            isDark={isDark}
            backgroundColor={palette.white}
            textColor={colors.text}
            borderColor={colors.border}
            style={styles.actionBtn}
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
    padding: 12,
    borderWidth: 1,
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {},
  body: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {},
  posted: {},
  source: {
    marginTop: 6,
  },
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
  actionBtn: {
    marginTop: 14,
  },
});
