import { Text, View } from 'react-native';

type Tone = 'good' | 'neutral' | 'critical';

const TONE_CLASSES: Record<Tone, { dot: string; bg: string; text: string }> = {
  good: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  neutral: {
    dot: 'bg-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-600 dark:text-neutral-300',
  },
  critical: {
    dot: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
  },
};

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONE_CLASSES[tone];
  return (
    <View className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${t.bg}`}>
      <View className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      <Text className={`text-xs font-medium ${t.text}`}>{label}</Text>
    </View>
  );
}
