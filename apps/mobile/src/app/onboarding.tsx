import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'chatbubbles' as const,
    title: 'Never miss a comment',
    description:
      'InstaAuto replies to Instagram comments and DMs the moment they land, day or night.',
  },
  {
    icon: 'flash' as const,
    title: 'Set up in minutes',
    description: 'Pick a trigger keyword, write a reply template, and go live - no code required.',
  },
  {
    icon: 'stats-chart' as const,
    title: 'See what converts',
    description:
      'Track replies sent and engagement in real time so you know exactly what is working.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboardingStatus();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View className="flex-row justify-end px-6 pt-2">
        {!isLastSlide && (
          <Pressable accessibilityRole="button" onPress={finish} hitSlop={12}>
            <Text className="text-sm font-medium text-neutral-400 dark:text-neutral-500">Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <Slide icon={item.icon} title={item.title} description={item.description} />
        )}
      />

      <View className="gap-8 px-6 pb-4">
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((slide, index) => (
            <Dot key={slide.title} active={index === activeIndex} />
          ))}
        </View>

        <Button
          label={isLastSlide ? 'Get started' : 'Next'}
          onPress={() => {
            if (isLastSlide) {
              finish();
            } else {
              listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function Slide({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
      <Animated.View
        entering={FadeIn.duration(400)}
        className="mb-10 h-40 w-40 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/10"
      >
        <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-600">
          <Ionicons name={icon} size={52} color="white" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <Text className="mb-3 text-center text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          {title}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(140).duration(400)}>
        <Text className="text-center text-base leading-6 text-neutral-500 dark:text-neutral-400">
          {description}
        </Text>
      </Animated.View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const progress = useSharedValue(active ? 1 : 0);
  progress.value = withTiming(active ? 1 : 0, { duration: 250 });

  const style = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [8, 24]),
    opacity: interpolate(progress.value, [0, 1], [0.35, 1]),
  }));

  return <Animated.View style={style} className="h-2 rounded-full bg-brand-600" />;
}
