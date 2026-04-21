import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

import { supabase } from '../lib/supabase';
import {
  configureNotificationHandler,
  registerExpoPushTokenIfNeeded,
} from '../lib/pushNotifications';

/**
 * Registers foreground notification behavior, Expo push token (iOS + Android),
 * and refreshes the token when the native device token changes.
 */
export default function PushNotificationSetup() {
  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    const sub = Notifications.addPushTokenListener(() => {
      setTimeout(() => {
        void registerExpoPushTokenIfNeeded();
      }, 0);
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) return;
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        setTimeout(() => {
          void registerExpoPushTokenIfNeeded();
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
