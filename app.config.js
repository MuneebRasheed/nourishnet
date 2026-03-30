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

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      usesAppleSignIn: true,
      infoPlist: infoPlistWithGoogleScheme,
    },
    plugins,
  },
};
