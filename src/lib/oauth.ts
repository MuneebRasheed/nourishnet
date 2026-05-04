import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type OAuthResult = {
  data: { user: User; session: Session } | null;
  error: Error | null;
};

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

let googleConfigured = false;

function ensureGoogleConfigured() {
  if (googleConfigured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    ensureGoogleConfigured();
    if (!GOOGLE_WEB_CLIENT_ID) {
      return {
        data: null,
        error: new Error(
          'Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.'
        ),
      };
    }
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') {
      return { data: null, error: null };
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      return {
        data: null,
        error: new Error('No ID token from Google'),
      };
    }
    // This library does not pass a custom nonce to Google, so the ID token nonce will not
    // match a client-supplied value. Enable "Skip nonce check" for the Google provider in
    // Supabase Dashboard → Authentication → Providers → Google.
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) {
      console.error('Supabase Google Sign-In Error:', error.message);
      return { data: null, error };
    }
    if (data?.user && data?.session) {
      // Pre-populate profile with name and email from Google if available
      const userInfo = response.data.user;
      if (userInfo) {
        const updates: { full_name?: string; email?: string } = {};
        if (userInfo.name) {
          updates.full_name = userInfo.name;
        }
        if (userInfo.email) {
          updates.email = userInfo.email;
        }
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('profiles')
            .update(updates)
            .eq('id', data.user.id);
        }
      }
      return {
        data: { user: data.user, session: data.session },
        error: null,
      };
    }
    return { data: null, error: new Error('No session returned') };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
      return { data: null, error: null };
    }
    if (
      e?.code === statusCodes.IN_PROGRESS ||
      e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
    ) {
      return {
        data: null,
        error: new Error(e?.message ?? 'Google sign-in failed'),
      };
    }
    console.error('Google Sign-In Error:', e);
    return {
      data: null,
      error:
        e instanceof Error
          ? e
          : new Error(String(e?.message ?? 'Google sign-in failed')),
    };
  }
}

export async function signInWithApple(): Promise<OAuthResult> {
  try {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) {
      return { data: null, error: new Error('No identity token from Apple') };
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) {
      console.error('Supabase Apple Sign-In Error:', error.message);
      return { data: null, error };
    }
    if (data?.user && data?.session) {
      // Pre-populate profile with name from Apple if available
      if (credential.fullName) {
        const givenName = credential.fullName.givenName?.trim() ?? '';
        const familyName = credential.fullName.familyName?.trim() ?? '';
        if (givenName || familyName) {
          const fullName = [givenName, familyName].filter(Boolean).join(' ');
          // Store in auth user metadata
          await supabase.auth.updateUser({
            data: { givenName, familyName },
          });
          // Also pre-populate the profile table so EditProfileScreen can use it
          await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);
          await supabase.auth.refreshSession();
        }
      }
      // Pre-populate email from Apple if available and not already set
      if (credential.email) {
        await supabase
          .from('profiles')
          .update({ email: credential.email })
          .eq('id', data.user.id)
          .is('email', null);
      }
      return {
        data: { user: data.user, session: data.session },
        error: null,
      };
    }
    return { data: null, error: new Error('No session returned') };
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === 'ERR_REQUEST_CANCELED') {
      return { data: null, error: null };
    }
    console.error('Apple Sign-In Error:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Apple sign-in failed'),
    };
  }
}
