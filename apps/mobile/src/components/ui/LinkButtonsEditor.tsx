import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { TextField } from '@/components/ui/TextField';

export interface LinkButtonValue {
  label: string;
  url: string;
}

/** Up to 3 real clickable (label, url) buttons shown on the final CTA message, instead of a bare
 * URL pasted into the text. */
export function LinkButtonsEditor({
  values,
  onChange,
}: {
  values: LinkButtonValue[];
  onChange: (values: LinkButtonValue[]) => void;
}) {
  return (
    <View className="gap-3">
      {values.map((value, i) => (
        <View
          key={i}
          className="gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
              Button {i + 1}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove button ${i + 1}`}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(values.filter((_, idx) => idx !== i));
              }}
              className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <Ionicons name="close" size={14} color="#a3a3a3" />
            </Pressable>
          </View>
          <TextField
            label="Label"
            value={value.label}
            onChangeText={(text) => {
              const next = [...values];
              next[i] = { ...next[i]!, label: text };
              onChange(next);
            }}
            maxLength={20}
            placeholder="e.g. Guide"
          />
          <TextField
            label="URL"
            value={value.url}
            onChangeText={(text) => {
              const next = [...values];
              next[i] = { ...next[i]!, url: text };
              onChange(next);
            }}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://..."
          />
        </View>
      ))}
      {values.length < 3 && (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onChange([...values, { label: '', url: '' }]);
          }}
          className="items-center rounded-xl border border-dashed border-neutral-300 py-2.5 dark:border-neutral-700"
        >
          <Text className="text-sm font-medium text-brand-600 dark:text-brand-400">
            + Add button
          </Text>
        </Pressable>
      )}
    </View>
  );
}
