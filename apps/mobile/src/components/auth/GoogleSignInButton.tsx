import { useState } from 'react';
import { Text, View } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { useGoogleLogin } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

if (webClientId) {
  GoogleSignin.configure({ webClientId, iosClientId });
}

export function GoogleSignInButton() {
  const googleLogin = useGoogleLogin();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (!webClientId) {
    return (
      <Text className="text-center text-xs text-neutral-400 dark:text-neutral-500">
        Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and _IOS_CLIENT_ID) to enable Google Sign-In.
      </Text>
    );
  }

  const onPress = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data.idToken) return;
      await googleLogin.mutateAsync(response.data.idToken);
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Cancelling isn't an error worth surfacing.
      if (code === statusCodes.SIGN_IN_CANCELLED || code === statusCodes.IN_PROGRESS) return;
      setError(extractErrorMessage(err));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View className="gap-2">
      <Button
        label="Continue with Google"
        variant="google"
        icon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
        onPress={onPress}
        loading={signingIn || googleLogin.isPending}
      />
      {error && <Text className="text-center text-sm text-red-600 dark:text-red-400">{error}</Text>}
    </View>
  );
}
