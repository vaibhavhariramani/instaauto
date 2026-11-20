import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const TEMPLATE_VARIABLES = [
  { token: '{{username}}', label: 'Username' },
  { token: '{{first_name}}', label: 'First name' },
  { token: '{{reel_title}}', label: 'Reel title' },
] as const;

/**
 * Tapping a chip appends that token to the field's current value — the backend's
 * renderTemplate (automationMatcher.ts) substitutes it per-recipient when the message sends.
 * first_name has no real source at comment-time (Instagram only gives us a username there) and
 * falls back to the username, but the token is still offered since it resolves correctly for
 * messages sent after a DM thread is established.
 */
export function TemplateVariableChips({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {TEMPLATE_VARIABLES.map((v) => (
        <Pressable
          key={v.token}
          onPress={() => {
            Haptics.selectionAsync();
            onInsert(v.token);
          }}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <Text className="text-xs font-medium text-brand-600 dark:text-brand-400">
            + {v.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function appendTemplateToken(current: string, token: string): string {
  if (current.length === 0) return token;
  return current.endsWith(' ') ? `${current}${token}` : `${current} ${token}`;
}
