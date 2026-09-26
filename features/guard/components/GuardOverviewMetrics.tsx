import MotorcycleIcon from "@/components/ui/MotorcycleIcon";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ClockAlert, Keyboard } from "lucide-react-native";
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
  const { isDark } = useAppTheme();
  const {
    totalParked = 0,
    totalSlots = 100,
    manualEntriesCount = 0,
    overstayCount = 0,
  } = data;

  const iconColor = isDark ? "#A1A1AA" : "#71717A";

  const metrics = [
    {
      key: "occupancy",
      icon: <MotorcycleIcon size={16} color={iconColor} strokeWidth={1.8} />,
      value: `${totalParked}/${totalSlots}`,
      label: "Occupancy",
    },
    {
      key: "manual",
      icon: <Keyboard size={16} color={iconColor} strokeWidth={1.8} />,
      value: String(manualEntriesCount),
      label: "Manual Input",
    },
    {
      key: "overstay",
      icon: <ClockAlert size={16} color={iconColor} strokeWidth={1.8} />,
      value: String(overstayCount),
      label: "Overstaying",
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
            {/* Top row: Icon */}
            <View className="flex-row items-center justify-between mb-2.5">
              <View className="w-8 h-8 rounded-xl bg-light-surfaceMuted/80 dark:bg-dark-surfaceMuted/40 items-center justify-center">
                {m.icon}
              </View>
            </View>

            {/* Value & Label */}
            <View>
              <Text
                className="text-light-text dark:text-dark-text font-bold text-[18px] leading-6 tracking-tight"
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
