import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'google';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<
  NonNullable<ButtonProps['variant']>,
  { container: string; text: string; spinner: string }
> = {
  primary: {
    container: 'bg-brand-500',
    text: 'text-white',
    spinner: '#fff',
  },
  secondary: {
    container: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-900 dark:text-neutral-50',
    spinner: '#5e6ad2',
  },
  destructive: {
    container: 'bg-red-600',
    text: 'text-white',
    spinner: '#fff',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-brand-600 dark:text-brand-400',
    spinner: '#5e6ad2',
  },
  google: {
    container: 'bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700',
    text: 'text-neutral-800 dark:text-neutral-100',
    spinner: '#5e6ad2',
  },
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  icon,
  className = '',
  onPressIn,
  ...props
}: ButtonProps & { className?: string }) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPressIn={(e) => {
        if (!isDisabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressIn?.(e);
      }}
      style={({ pressed }) => [{ opacity: pressed && !isDisabled ? 0.7 : isDisabled ? 0.5 : 1 }]}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-4 py-3.5 ${styles.container} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={styles.spinner} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text className={`text-base font-semibold ${styles.text}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
