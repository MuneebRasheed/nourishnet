import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nourishnet_onboarding_completed';

/** True after the user has signed in or completed signup at least once (persists until app uninstall). */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}
