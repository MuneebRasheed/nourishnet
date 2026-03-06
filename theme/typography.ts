/**
 * Font family names to use with fontFamily in styles.
 * Match your Figma typography: use these constants so fonts stay consistent.
 *
 * Usage: fontFamily: fontFamilies.poppins  or  fontFamily: fontFamilies.inter
 */

export const fontFamilies = {
  // Poppins (Figma: Poppins)
  poppins: 'Poppins_400Regular',
  poppinsMedium: 'Poppins_500Medium',
  poppinsSemiBold: 'Poppins_600SemiBold',
  poppinsBold: 'Poppins_700Bold',

  // Inter (Figma: Inter / UI)
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
} as const;

export type FontFamily = (typeof fontFamilies)[keyof typeof fontFamilies];
