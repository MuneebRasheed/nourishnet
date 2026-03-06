import React, { useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EditIcon from '../assets/svgs/EditIcon';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import BoxIcon from '../assets/svgs/BoxIcon';
import ClockICon from '../assets/svgs/ClockICon';
import LocationPin from '../assets/svgs/LocationPin';

type ProviderListingCardProps = {
  title: string;
  portionsLabel: string;
  timeRangeLabel: string;
  address: string;
  foodType?: string | null;
  statusLabel?: string;
  statusColor?: string;
  imageSource?: ImageSourcePropType;
  onPressViewRequests?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

const defaultFoodImage = require('../assets/images/FoodOnboard1.png');

export function ProviderListingCard({
  title,
  portionsLabel,
  timeRangeLabel,
  address,
  foodType,
  statusLabel = 'Active',
  statusColor = palette.roleBulbColor2,
  imageSource,
  onPressViewRequests,
  onEdit,
  onDelete,
}: ProviderListingCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, triggerWidth: 0 });
  const threeDotRef = useRef<View>(null);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();

  const cardBg = isDark ? colors.inputFieldBg : palette.white;
  const borderColor = colors.borderColor;

  const MENU_WIDTH = 140;

  const openMenu = () => {
    threeDotRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({
        x,
        y: y + height + 10,
        triggerWidth: width,
      });
      setMenuVisible(true);
    });
  };
  const closeMenu = () => setMenuVisible(false);
  const handleEdit = () => {
    closeMenu();
    onEdit?.();
  };
  const handleDelete = () => {
    closeMenu();
    onDelete?.();
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.topRow}>
        <Image
          source={imageSource ?? defaultFoodImage}
          style={styles.image}
        />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.interSemiBold,
                  fontSize: fonts.body + 2,
                },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusColor ?? colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: palette.white, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption },
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
              {(onEdit != null || onDelete != null) && (
                <View ref={threeDotRef} collapsable={false}>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={openMenu}
                    style={styles.threeDotBtn}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={closeMenu}
          >
            <Pressable style={styles.modalOverlay} onPress={closeMenu}>
              <View
                style={[
                  styles.modalMenu,
                  styles.modalMenuPositioned,
                  styles.modalMenuShadow,
                  {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.6)",
                    borderColor: colors.borderColor,
                    top: menuLayout.y,
                    left: Math.max(12, menuLayout.x + menuLayout.triggerWidth - MENU_WIDTH),
                    width: MENU_WIDTH,
                  },
                ]}
                onStartShouldSetResponder={() => true}
              >
                {onEdit != null && (
                  <TouchableOpacity style={styles.menuItemRow} onPress={handleEdit} activeOpacity={0.7}>
                    <EditIcon width={18} height={18} color={colors.text} />
                    <Text style={[styles.menuItemText, { color: colors.text, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                )}
                {onEdit != null && onDelete != null && <View style={[styles.menuDivider, { backgroundColor: colors.borderColor }]} />}
                {onDelete != null && (
                  <TouchableOpacity style={styles.menuItemRow} onPress={handleDelete} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color={palette.logoutColor} />
                    <Text style={[styles.menuItemText, { color: palette.logoutColor, fontFamily: fontFamilies.interMedium, fontSize: fonts.caption }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Pressable>
          </Modal>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BoxIcon width={14} height={14} color={colors.textSecondary} />
              <Text
                style={[
                  styles.metaText,
                  {
                    color: colors.textSecondary,
                    fontFamily: fontFamilies.inter,
                    fontSize: fonts.caption,
                  },
                ]}
                numberOfLines={1}
              >
                {portionsLabel}
              </Text>
            </View>
            {foodType != null && foodType !== '' && (
              <>
                <View style={styles.dot} />
                <View style={styles.metaItem}>
                  <Text
                    style={[
                      styles.metaText,
                      {
                        color: colors.textSecondary,
                        fontFamily: fontFamilies.inter,
                        fontSize: fonts.caption,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {foodType}
                  </Text>
                </View>
              </>
            )}
            {/* <View style={styles.dot} /> */}
            <View style={styles.metaItemTime}>
              <ClockICon
                width={14}
                height={14}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.metaText,
                  {
                    color: colors.textSecondary,
                    fontFamily: fontFamilies.inter,
                    fontSize: fonts.caption,
                  },
                ]}
              >
                {timeRangeLabel}
              </Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <LocationPin
              width={14}
              height={14}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.addressText,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.inter,
                  fontSize: fonts.caption,
                },
              ]}
              numberOfLines={2}
            >
              {address}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            borderColor:colors.borderColor,
            backgroundColor:  colors.inputFieldBg 
          },
        ]}
        onPress={onPressViewRequests}
      >
        <Text
          style={[
            styles.buttonLabel,
            {
              color: colors.text,
              fontFamily: fontFamilies.interSemiBold,
              fontSize: fonts.subhead,
            },
          ]}
        >
          View Requests
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    // borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {},
  threeDotBtn: {
    padding: 4,
    margin: -4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMenu: {
    flexDirection: 'column',
    paddingVertical: 1,
    paddingHorizontal: 1,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalMenuPositioned: {
    position: 'absolute',
  },
  modalMenuShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  menuDivider: {
    height: 2,
    // marginVertical: 2,
    marginHorizontal: 10,
  },
  menuItemText: {},
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
    minWidth: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  metaItemTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  metaText: {
    flexShrink: 1,
    minWidth: 0,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c2c8cf',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    flex: 1,
    minWidth: 0,
  },
  button: {
    marginTop: 20,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {},
});

