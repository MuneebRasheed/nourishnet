import { PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

/**
 * Split a stored profile phone (usually E.164, e.g. +923435234561) into the pieces
 * `react-native-phone-number-input` expects: national digits + ISO region for defaultCode.
 */
export function parseStoredPhoneForPhoneInput(stored: string | null | undefined): {
  nationalDigits: string;
  isoRegion: string;
} {
  const raw = stored?.trim() ?? '';
  if (!raw) {
    return { nationalDigits: '', isoRegion: 'PK' };
  }
  try {
    const parsed = phoneUtil.parse(raw);
    const isoRegion = phoneUtil.getRegionCodeForNumber(parsed) ?? 'PK';
    const national = parsed.getNationalNumber();
    const nationalDigits =
      national != null ? String(national).replace(/\D/g, '') : raw.replace(/\D/g, '');
    return { nationalDigits, isoRegion };
  } catch {
    return { nationalDigits: '', isoRegion: 'PK' };
  }
}
