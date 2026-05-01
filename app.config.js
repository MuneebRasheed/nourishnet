/* eslint-disable @typescript-eslint/no-require-imports */
const appJson = require('./app.json');

const googleIosUrlScheme =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ||
  'com.googleusercontent.apps.REPLACE_WITH_REVERSED_IOS_CLIENT_ID';

const plugins = [...(appJson.expo.plugins || [])].filter((p) => {
  const id = Array.isArray(p) ? p[0] : p;
  return id !== '@react-native-google-signin/google-signin';
});

plugins.push('expo-apple-authentication', [
  '@react-native-google-signin/google-signin',
  { iosUrlScheme: googleIosUrlScheme },
]);

plugins.push([
  'expo-notifications',
  {
    enableBackgroundRemoteNotifications: true,
    mode: 'production',
  },
]);

const existingInfoPlist = appJson.expo.ios?.infoPlist ?? {};
const existingUrlTypes = Array.isArray(existingInfoPlist.CFBundleURLTypes)
  ? existingInfoPlist.CFBundleURLTypes
  : [];
const hasGoogleScheme = existingUrlTypes.some((entry) =>
  Array.isArray(entry?.CFBundleURLSchemes)
    ? entry.CFBundleURLSchemes.includes(googleIosUrlScheme)
    : false
);

const infoPlistWithGoogleScheme = hasGoogleScheme
  ? existingInfoPlist
  : {
      ...existingInfoPlist,
      CFBundleURLTypes: [
        ...existingUrlTypes,
        {
          CFBundleURLSchemes: [googleIosUrlScheme],
        },
      ],
    };

/** Required on iOS or location APIs crash before the permission dialog (expo-location). */
const LOCATION_WHEN_IN_USE =
  'NourishNet uses your location to fill in your profile address when you choose Use current location.';

const infoPlistFinal = {
  ...infoPlistWithGoogleScheme,
  NSLocationWhenInUseUsageDescription: LOCATION_WHEN_IN_USE,
};

const extraEasProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID || appJson.expo.extra?.eas?.projectId;

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      usesAppleSignIn: true,
      infoPlist: infoPlistFinal,
    },
    plugins,
    extra: {
      ...(appJson.expo.extra || {}),
      eas: {
        ...(appJson.expo.extra?.eas || {}),
        ...(extraEasProjectId ? { projectId: extraEasProjectId } : {}),
      },
    },
  },
};
