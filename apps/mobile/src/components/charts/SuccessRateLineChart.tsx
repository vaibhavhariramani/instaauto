import { Fragment, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

export interface SuccessPoint {
  label: string;
  dmsSent: number;
  dmsFailed: number;
}

const CHART_HEIGHT = 140;

export function SuccessRateLineChart({ data }: { data: SuccessPoint[] }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const gridline = isDark ? '#2c2c2a' : '#e1e0d9';
  const sentColor = isDark ? '#199e70' : '#1baf7a';
  const failedColor = isDark ? '#e05252' : '#d03b3b';

  const max = Math.max(1, ...data.flatMap((d) => [d.dmsSent, d.dmsFailed]));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const innerH = CHART_HEIGHT - 16;
  const columnWidth = width / Math.max(data.length, 1);

  const active = selected != null ? data[selected] : null;

  const yFor = (value: number) => CHART_HEIGHT - (value / niceMax) * innerH;
  const xFor = (i: number) => i * columnWidth + columnWidth / 2;
  const pointsFor = (key: 'dmsSent' | 'dmsFailed') =>
    data.map((d, i) => `${xFor(i)},${yFor(d[key])}`).join(' ');

  return (
    <View>
      <View className="mb-3 flex-row items-center gap-4">
        <Legend color={sentColor} label="Successful" />
        <Legend color={failedColor} label="Unsuccessful" />
      </View>

      <View style={{ height: CHART_HEIGHT }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && data.length > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {[0, 0.5, 1].map((f) => (
              <Line
                key={f}
                x1={0}
                x2={width}
                y1={CHART_HEIGHT - f * innerH}
                y2={CHART_HEIGHT - f * innerH}
                stroke={gridline}
                strokeWidth={1}
              />
            ))}
            <Polyline
              points={pointsFor('dmsSent')}
              fill="none"
              stroke={sentColor}
              strokeWidth={2}
            />
            <Polyline
              points={pointsFor('dmsFailed')}
              fill="none"
              stroke={failedColor}
              strokeWidth={2}
            />
            {data.map((d, i) => (
              <Fragment key={d.label}>
                <Circle
                  cx={xFor(i)}
                  cy={yFor(d.dmsSent)}
                  r={selected === i ? 4 : 3}
                  fill={sentColor}
                  opacity={selected == null || selected === i ? 1 : 0.4}
                />
                <Circle
                  cx={xFor(i)}
                  cy={yFor(d.dmsFailed)}
                  r={selected === i ? 4 : 3}
                  fill={failedColor}
                  opacity={selected == null || selected === i ? 1 : 0.4}
                />
              </Fragment>
            ))}
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
                  : 'text-neutral-600 dark:text-neutral-500'
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
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">{active.label}:</Text>
            <Text className="text-xs font-medium text-neutral-900 dark:text-neutral-50">
              {active.dmsSent} successful
            </Text>
            <Text className="text-xs font-medium text-red-600 dark:text-red-400">
              {active.dmsFailed} unsuccessful
            </Text>
          </>
        ) : (
          <Text className="text-xs text-neutral-600 dark:text-neutral-500">
            Tap a point for details
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
      <Text className="text-xs text-neutral-600 dark:text-neutral-400">{label}</Text>
    </View>
  );
}
