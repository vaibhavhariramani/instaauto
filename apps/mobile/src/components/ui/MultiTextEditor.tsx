import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { TextField } from '@/components/ui/TextField';

/** A list of free-text variations (e.g. public-reply options picked at random per trigger),
 * each removable, with an "add another" row at the bottom. */
export function MultiTextEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  return (
    <View className="gap-3">
      {values.map((value, i) => (
        <View key={i} className="flex-row items-start gap-2">
          <View className="flex-1">
            <TextField
              label={`Variation ${i + 1}`}
              value={value}
              onChangeText={(text) => {
                const next = [...values];
                next[i] = text;
                onChange(next);
              }}
              multiline
              numberOfLines={2}
              style={{ minHeight: 60, textAlignVertical: 'top' }}
              placeholder={placeholder}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove variation ${i + 1}`}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(values.filter((_, idx) => idx !== i));
            }}
            className="mt-7 h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <Ionicons name="close" size={16} color="#a3a3a3" />
          </Pressable>
        </View>
      ))}
      {values.length < 10 && (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onChange([...values, '']);
          }}
          className="items-center rounded-xl border border-dashed border-neutral-300 py-2.5 dark:border-neutral-700"
        >
          <Text className="text-sm font-medium text-brand-600 dark:text-brand-400">
            + Add variation
          </Text>
        </Pressable>
      )}
    </View>
  );
}
