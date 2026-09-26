import { useAppTheme } from "@/hooks/useAppTheme";
import { Car, ClockAlert, Keyboard } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export interface GuardOverviewMetricsData {
  totalParked: number;
  totalSlots: number;
  manualEntriesCount: number;
  overstayCount: number;
}

interface GuardOverviewMetricsProps {
  data: GuardOverviewMetricsData;
  onCapacityPress?: () => void;
  onManualPress?: () => void;
  onOverstayPress?: () => void;
}

export default function GuardOverviewMetrics({
  data,
}: GuardOverviewMetricsProps) {
  const { colors, isDark } = useAppTheme();
  const {
    totalParked = 0,
    totalSlots = 100,
    manualEntriesCount = 0,
    overstayCount = 0,
  } = data;

  const metrics = [
    {
      key: "occupancy",
      icon: <Car size={15} color={colors.primary} strokeWidth={2} />,
      value: `${totalParked}/${totalSlots}`,
      label: "Occupancy",
      dotColor: colors.primary,
    },
    {
      key: "manual",
      icon: <Keyboard size={15} color={isDark ? "#A1A1AA" : "#71717A"} strokeWidth={2} />,
      value: String(manualEntriesCount),
      label: "Manual Input",
      dotColor: isDark ? "#A1A1AA" : "#71717A",
    },
    {
      key: "overstay",
      icon: <ClockAlert size={15} color={overstayCount > 0 ? colors.warning : colors.muted} strokeWidth={2} />,
      value: String(overstayCount),
      label: "Overstaying",
      valueColor: overstayCount > 0 ? colors.warning : undefined,
      dotColor: overstayCount > 0 ? colors.warning : colors.muted,
    },
  ];

  return (
    <View className="mt-5">
      <View className="flex-row gap-2.5">
        {metrics.map((m) => (
          <View
            key={m.key}
            className="flex-1 bg-light-surface dark:bg-dark-surface rounded-2xl p-3.5 border border-light-border dark:border-dark-border justify-between"
          >
            {/* Top row: Icon + status dot */}
            <View className="flex-row items-center justify-between mb-2">
              <View className="w-7 h-7 rounded-lg bg-light-surfaceMuted/80 dark:bg-dark-surfaceMuted/40 items-center justify-center">
                {m.icon}
              </View>
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: m.dotColor }}
              />
            </View>

            {/* Value & Label */}
            <View>
              <Text
                className="text-light-text dark:text-dark-text font-bold text-[18px] leading-6 tracking-tight"
                style={m.valueColor ? { color: m.valueColor } : undefined}
                numberOfLines={1}
              >
                {m.value}
              </Text>
              <Text
                className="text-light-muted dark:text-dark-muted font-book text-[11px] mt-0.5"
                numberOfLines={1}
              >
                {m.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
