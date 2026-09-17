import type { ExpoConfig } from 'expo/config';

// The iOS client id's "reversed" form (com.googleusercontent.apps.<id>) is
// what Google's native SDK needs registered as a URL scheme to catch the
// OAuth redirect - Google always derives it the same way, so it's computed
// here instead of asking for it as a second env var.
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const iosUrlScheme = iosClientId
  ? `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`
  : undefined;

const config: ExpoConfig = {
  name: 'InstaAuto',
  slug: 'instaauto',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'instaauto',
  userInterfaceStyle: 'automatic',
  owner: 'vaibhavji',
  extra: {
    eas: {
      projectId: 'e2df383a-b4fa-4bed-a97a-2ec7a9dca4c9',
    },
  },
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.vaibhavhariramani.instaauto',
    supportsTablet: false,
  },
  android: {
    package: 'com.vaibhavhariramani.instaauto',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#fafafa',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        dark: {
          backgroundColor: '#0a0a0a',
          image: './assets/images/splash-icon.png',
        },
      },
    ],
    'expo-secure-store',
    'expo-notifications',
    // The plugin hard-requires a real iosUrlScheme at prebuild time (an
    // empty options object throws), so it's only added once
    // EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is set - until then the app builds
    // fine, Google Sign-In's button just can't complete the native flow.
    ...(iosUrlScheme
      ? ([['@react-native-google-signin/google-signin', { iosUrlScheme }]] as [string, unknown][])
      : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
