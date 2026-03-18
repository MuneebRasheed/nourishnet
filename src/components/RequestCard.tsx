import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors, palette } from '../../utils/colors';
import { useAppFontSizes } from '../../theme/fonts';
import { fontFamilies } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import LockIcon from '../assets/svgs/LockIcon';
import QrCode from '../assets/svgs/QrCode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigations/RootNavigation';

const defaultAvatar = require('../assets/images/Avatar.png');

export type RequestPriority = 'high' | 'medium';

export type ListingRequestItem = {
  id: string;
  requesterName: string;
  avatar?: ImageSourcePropType;
  distance: string;
  requestedAt: string;
  priority: RequestPriority;
};

/** Separate component for the requester avatar image (circular profile image in request cards). */
type RequesterAvatarProps = {
  source?: ImageSourcePropType;
  size?: number;
};

export function RequesterAvatar({ source = defaultAvatar, size = 48 }: RequesterAvatarProps) {
  return (
    <Image
      source={source}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

export type RequestCardVariant = 'pending' | 'accepted';

type RequestCardProps = {
  item: ListingRequestItem;
  variant?: RequestCardVariant;
  onAccept?: () => void;
  onDecline?: () => void;
  onQRCode?: () => void;
  onPinCode?: () => void;
  disabled?: boolean;
};

export function RequestCard({
  item,
  variant = 'pending',
  onAccept,
  onDecline,
  onQRCode,
  onPinCode,
  disabled = false,
}: RequestCardProps) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const colors = getColors(isDark);
  const fonts = useAppFontSizes();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const priorityBg = item.priority === 'high' ? palette.highPriorityBg : palette.roleCardbg;
  const priorityTextColor = item.priority === 'high' ? palette.logoutColor : palette.roleBulbColor3;
  const isAccepted = variant === 'accepted';

  return (
    <View style={[styles.card, { backgroundColor: colors.inputFieldBg,borderColor: colors.borderColor,borderWidth: 1,}]}>
      <View style={styles.cardTop}>
        <RequesterAvatar source={item.avatar} />
        <View style={styles.cardInfo}>
          <Text
            style={[
              styles.requesterName,
              { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.body },
            ]}
            numberOfLines={1}
          >
            {item.requesterName}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text
              style={[
                styles.metaText,
                { color: colors.textSecondary, fontFamily: fontFamilies.inter, fontSize: fonts.caption },
              ]}
            >
              {item.distance} • Requested {item.requestedAt}
            </Text>
          </View>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: priorityBg }]}>
          <Text
            style={[
              styles.priorityText,
              { color: priorityTextColor, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.caption - 1 },
            ]}
          >
            {item.priority === 'high' ? 'High Priority' : 'Medium Priority'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        {isAccepted ? (
          <>
            <Pressable
              onPress={() => {
              onQRCode?.();
              navigation.navigate('QRCodeScreen');
            }}
              style={[styles.acceptBtn1, { backgroundColor: colors.primary }]}
            >
              <QrCode width={20} height={20} />
              <Text
                style={[
                  styles.btnLabel1,
                  { color: palette.white, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead },
                ]}
              >
                QR Code
              </Text>
            </Pressable>
            <Pressable
              onPress={onPinCode}
              style={[styles.declineBtn1, { backgroundColor: colors.requestBtnBg , borderColor: colors.borderColor,}]}
            >
              <LockIcon width={20} height={20} color={colors.text} />
              <Text
                style={[
                  styles.btnLabel2,
                  { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead },
                ]}
              >
                Pin Code
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              disabled={disabled}
              onPress={onAccept}
              style={[styles.acceptBtn, { backgroundColor: colors.primary }, disabled && styles.disabledBtn]}
            >
              <Ionicons name="checkmark" size={20} color={palette.white} />
              <Text
                style={[
                  styles.btnLabel,
                  { color: palette.white, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead },
                ]}
              >
                Accept
              </Text>
            </Pressable>
            <Pressable
              disabled={disabled}
              onPress={onDecline}
              style={[
                styles.declineBtn,
                { backgroundColor: colors.requestBtnBg, borderColor: colors.borderColor, borderWidth: 1 },
                disabled && styles.disabledBtn,
              ]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
              <Text
                style={[
                  styles.btnLabel,
                  { color: colors.text, fontFamily: fontFamilies.interSemiBold, fontSize: fonts.subhead },
                ]}
              >
                Decline
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    marginRight: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  requesterName: {
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {},
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {},
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 100,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 100,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnLabel: {},
  btnLabel2:{
    

  },
  btnLabel1:{
    
  },
  acceptBtn1:{
    // flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 100,
  },
  declineBtn1:{
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
   
  },
});
