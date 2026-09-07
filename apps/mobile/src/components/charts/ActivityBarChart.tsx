import { Fragment, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

export interface ActivityPoint {
  label: string;
  commentsDetected: number;
  dmsSent: number;
  dmsFailed: number;
}

const SERIES = {
  comments: { light: '#2a78d6', dark: '#3987e5', name: 'Comments detected' },
  sent: { light: '#1baf7a', dark: '#199e70', name: 'DMs sent' },
};

const CHART_HEIGHT = 140;

export function ActivityBarChart({ data }: { data: ActivityPoint[] }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const gridline = isDark ? '#2c2c2a' : '#e1e0d9';
  const axisText = isDark ? '#898781' : '#898781';
  const commentsColor = isDark ? SERIES.comments.dark : SERIES.comments.light;
  const sentColor = isDark ? SERIES.sent.dark : SERIES.sent.light;

  const max = Math.max(1, ...data.flatMap((d) => [d.commentsDetected, d.dmsSent]));
  const niceMax = Math.ceil(max / 4) * 4 || 4;

  const columnWidth = width / Math.max(data.length, 1);
  const barWidth = Math.min(10, columnWidth / 3);
  const gap = 3;

  const active = selected != null ? data[selected] : null;

  return (
    <View>
      <View className="mb-3 flex-row items-center gap-4">
        <Legend color={commentsColor} label="Comments" />
        <Legend color={sentColor} label="DMs sent" />
      </View>

      <View style={{ height: CHART_HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {[0, 0.5, 1].map((f) => (
              <Line
                key={f}
                x1={0}
                x2={width}
                y1={CHART_HEIGHT - f * (CHART_HEIGHT - 16)}
                y2={CHART_HEIGHT - f * (CHART_HEIGHT - 16)}
                stroke={gridline}
                strokeWidth={1}
              />
            ))}
            {data.map((d, i) => {
              const cx = i * columnWidth + columnWidth / 2;
              const commentsH = (d.commentsDetected / niceMax) * (CHART_HEIGHT - 16);
              const sentH = (d.dmsSent / niceMax) * (CHART_HEIGHT - 16);
              const baseline = CHART_HEIGHT - 16;
              return (
                <Fragment key={d.label}>
                  <Rect
                    x={cx - barWidth - gap / 2}
                    y={baseline - commentsH}
                    width={barWidth}
                    height={Math.max(commentsH, 1)}
                    rx={3}
                    fill={commentsColor}
                    opacity={selected == null || selected === i ? 1 : 0.35}
                  />
                  <Rect
                    x={cx + gap / 2}
                    y={baseline - sentH}
                    width={barWidth}
                    height={Math.max(sentH, 1)}
                    rx={3}
                    fill={sentColor}
                    opacity={selected == null || selected === i ? 1 : 0.35}
                  />
                </Fragment>
              );
            })}
          </Svg>
        )}

        {width > 0 && (
          <View className="absolute inset-0 flex-row">
            {data.map((d, i) => (
              <Pressable
                key={d.label}
                style={{ width: columnWidth }}
                onPress={() => setSelected(selected === i ? null : i)}
              />
            ))}
          </View>
        )}
      </View>

      <View className="mt-1 flex-row">
        {data.map((d, i) => (
          <View key={d.label} style={{ width: columnWidth }} className="items-center">
            <Text
              className={`text-[10px] ${
                selected === i
                  ? 'font-semibold text-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
              numberOfLines={1}
            >
              {d.label}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-3 min-h-[20px] flex-row items-center justify-center gap-3 border-t border-neutral-100 pt-2 dark:border-neutral-800">
        {active ? (
          <>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">{active.label}:</Text>
            <Text className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
              {active.commentsDetected} comments
            </Text>
            <Text className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
              {active.dmsSent} sent
            </Text>
            {active.dmsFailed > 0 && (
              <Text className="text-xs font-medium text-red-600 dark:text-red-400">
                {active.dmsFailed} failed
              </Text>
            )}
          </>
        ) : (
          <Text className="text-xs text-neutral-400 dark:text-neutral-500">
            Tap a bar for details
          </Text>
        )}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs text-neutral-500 dark:text-neutral-400">{label}</Text>
    </View>
  );
}
