import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { useAppleLogin } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';

export function AppleSignInButton({ onSuccess }: { onSuccess?: () => void }) {
  const appleLogin = useAppleLogin();
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  if (Platform.OS !== 'ios' || !available) return null;

  const onPress = async () => {
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) return;
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : null;
      await appleLogin.mutateAsync({ identityToken: credential.identityToken, fullName });
      onSuccess?.();
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Cancelling isn't an error worth surfacing.
      if (code === 'ERR_REQUEST_CANCELED') return;
      setError(extractErrorMessage(err));
    }
  };

  return (
    <View className="gap-2">
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={{ height: 50, width: '100%' }}
        onPress={onPress}
      />
      {error && <Text className="text-center text-sm text-red-600 dark:text-red-400">{error}</Text>}
    </View>
  );
}
