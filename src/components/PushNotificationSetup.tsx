import React, { useEffect, useRef } from 'react';
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
  const isRegisteringRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    const sub = Notifications.addPushTokenListener(async (tokenData) => {
      const newToken = tokenData.data;
      
      // Prevent duplicate registrations for the same token
      if (isRegisteringRef.current || lastTokenRef.current === newToken) {
        return;
      }

      isRegisteringRef.current = true;
      lastTokenRef.current = newToken;

      try {
        await registerExpoPushTokenIfNeeded();
      } finally {
        isRegisteringRef.current = false;
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        lastTokenRef.current = null;
        return;
      }
      
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        // Prevent duplicate registrations
        if (isRegisteringRef.current) {
          return;
        }

        isRegisteringRef.current = true;

        try {
          await registerExpoPushTokenIfNeeded();
        } finally {
          isRegisteringRef.current = false;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
