import { Pressable, Text, View } from 'react-native';

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center justify-center rounded-lg py-2.5 ${active ? 'bg-white dark:bg-neutral-800' : ''}`}
          >
            <Text
              className={`text-sm font-medium ${
                active
                  ? 'text-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
