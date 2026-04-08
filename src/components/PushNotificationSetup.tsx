import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { supabase } from '../lib/supabase';
import {
  configureNotificationHandler,
  registerIosPushTokenIfNeeded,
} from '../lib/pushNotifications';

/**
 * Registers foreground notification behavior, auth-based iOS token registration,
 * and refreshes the Expo token when the native device token changes.
 */
export default function PushNotificationSetup() {
  useEffect(() => {
    if (Platform.OS === 'ios') {
      configureNotificationHandler();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const sub = Notifications.addPushTokenListener(() => {
      setTimeout(() => {
        void registerIosPushTokenIfNeeded();
      }, 0);
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) return;
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        // Defer: async work + Supabase calls must not run inside the auth lock (deadlock risk).
        setTimeout(() => {
          void registerIosPushTokenIfNeeded();
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
