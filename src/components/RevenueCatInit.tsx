import { useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { useOfferingsStore } from '../../store/offeringsStore';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

/**
 * App-level RevenueCat setup. Offerings are stored for all native platforms;
 * verbose SDK logging and `console.log` for offerings run on iOS only.
 */
export default function RevenueCatInit() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const apiKey =
      Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined;

      console.log("apiKey.............",apiKey);
      

    if (!apiKey) {
      if (__DEV__) {
        console.warn('[RevenueCat] Missing EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / ANDROID_API_KEY');
      }
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        // if (Platform.OS === 'ios') {
          await Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        // }

        if (cancelled) {
          return;
        }

        Purchases.configure({ apiKey });

        const offerings = await Purchases.getOfferings();
        if (cancelled) {
          return;
        }
        useOfferingsStore.getState().setOfferings(offerings);
        // if (Platform.OS === 'ios') {
          console.log('[RevenueCat] getOfferings', JSON.stringify(offerings, null, 2));
        // }
      } catch (err) {
        if (cancelled) {
          return;
        }
        useOfferingsStore.getState().setOfferings(null);
        // if (Platform.OS === 'ios') {
          console.warn('[RevenueCat] getOfferings failed', err);
        // }
      }

      try {
        const info = await Purchases.getCustomerInfo();
        if (!cancelled) {
          useOfferingsStore.getState().setCustomerInfo(info);
        }
      } catch {
        if (!cancelled) {
          useOfferingsStore.getState().setCustomerInfo(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
