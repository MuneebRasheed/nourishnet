import { useSettingsStore } from '../store/settingStore';

export type FontSizes = {
  caption: number;
  body: number;
  subhead: number;
  title: number;
  largeTitle: number;
};

const normal: FontSizes = {
  caption: 12,
  body: 16,
  subhead: 14,
  title: 20,
  largeTitle: 24,
};

const large: FontSizes = {
  caption: 14,
  body: 20,
  subhead: 18,
  title: 24,
  largeTitle: 26,
};

export function getFontSizes(largeFont: boolean): FontSizes {
  return largeFont ? large : normal;
}

export function useAppFontSizes(): FontSizes {
  const largeFont = useSettingsStore((state) => state.largeFont);
  return getFontSizes(largeFont);
}
