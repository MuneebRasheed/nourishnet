import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

function getEasProjectId(): string | undefined {
  const fromConfig =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim();
  return undefined;
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function saveExpoPushTokenToProfile(userId: string, token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) return;

  // Check if token is already saved to avoid unnecessary updates
  const { data: profile } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', userId)
    .single();

  if (profile?.expo_push_token === trimmed) {
    console.log('[push] Token already saved, skipping update');
    return;
  }

  // Preferred path: atomically reassign token ownership to current user.
  const { error: rpcError } = await supabase.rpc('set_my_expo_push_token', {
    p_token: trimmed,
  });
  if (!rpcError) return;

  console.warn('[push] set_my_expo_push_token failed; using fallback update', rpcError.message);

  // Fallback for environments where migration/RPC is not available yet.
  const { error } = await supabase
    .from('profiles')
    .update({
      expo_push_token: trimmed,
      expo_push_token_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) {
    console.warn('[push] Failed to save expo push token', error.message);
  }
}

export async function clearExpoPushTokenFromProfile(userId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();
  if (currentUserId && currentUserId === userId) {
    const { error: rpcError } = await supabase.rpc('set_my_expo_push_token', { p_token: null });
    if (!rpcError) return;
    console.warn('[push] set_my_expo_push_token clear failed; using fallback update', rpcError.message);
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      expo_push_token: null,
      expo_push_token_updated_at: null,
    })
    .eq('id', userId);
  if (error) {
    console.warn('[push] Failed to clear expo push token', error.message);
  }
}

async function ensureAndroidDefaultChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Registers for remote push (Expo), requests permission, stores token on `profiles`.
 * Physical device only; simulators/emulators are skipped.
 */
export async function registerExpoPushTokenIfNeeded(): Promise<void> {
  if (!Device.isDevice) {
    console.warn('[push] Expo push token requires a physical device');
    return;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn(
      '[push] Missing EAS project id. Set EXPO_PUBLIC_EAS_PROJECT_ID in .env (expo.dev project → Project settings → Project ID).'
    );
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) return;

  await ensureAndroidDefaultChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status } =
    existing === 'granted'
      ? { status: existing }
      : await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('[push] Notification permission not granted');
    return;
  }

  const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenRes.data;
  if (!token) return;

  console.log('[push] Obtained Expo token; saving to profile');
  await saveExpoPushTokenToProfile(userId, token);
}

/** @deprecated Use `registerExpoPushTokenIfNeeded` */
export const registerIosPushTokenIfNeeded = registerExpoPushTokenIfNeeded;
