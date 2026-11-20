import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}

export function ListRow({
  icon,
  iconColor = '#5e6ad2',
  iconBg,
  label,
  subtitle,
  right,
  onPress,
  danger,
  testID,
}: ListRowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      testID={testID}
      className="flex-row items-center gap-3 border-t border-neutral-100 py-3 first:border-t-0 dark:border-neutral-800"
      {...(onPress
        ? {
            accessibilityRole: 'button' as const,
            accessibilityLabel: subtitle ? `${label}. ${subtitle}` : label,
          }
        : {})}
    >
      {icon ? (
        <View
          className="h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg ?? `${iconColor}1a` }}
        >
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text
          className={`text-sm ${danger ? 'font-medium text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-50'}`}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-neutral-600 dark:text-neutral-400">{subtitle}</Text>
        ) : null}
      </View>
      {right}
      {onPress && !right ? <Ionicons name="chevron-forward" size={16} color="#a3a3a3" /> : null}
    </Wrapper>
  );
}
