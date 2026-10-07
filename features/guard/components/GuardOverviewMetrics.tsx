import { MotorcycleIcon } from "@/components/ui/MotorcycleIcon";
import { GuardOverviewMetricsSkeleton } from "@/components/ui/Skeleton";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ClockAlert, CalendarDays } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export interface GuardOverviewMetricsData {
  totalParked: number;
  totalSlots: number;
  reservedTodayCount: number | null;
  overstayCount: number;
}

interface GuardOverviewMetricsProps {
  data: GuardOverviewMetricsData;
  isLoading?: boolean;
  onCapacityPress?: () => void;
  onOverstayPress?: () => void;
}

export default function GuardOverviewMetrics({
  data,
  isLoading = false,
}: GuardOverviewMetricsProps) {
  const { colors } = useAppTheme();
  if (isLoading) {
    return <GuardOverviewMetricsSkeleton />;
  }
  const {
    totalParked = 0,
    totalSlots = 100,
    reservedTodayCount = null,
    overstayCount = 0,
  } = data;

  const iconColor = colors.muted;

  const metrics = [
    {
      key: "occupancy",
      icon: <MotorcycleIcon size={16} color={iconColor} strokeWidth={1.8} />,
      value: `${totalParked}/${totalSlots}`,
      label: "Parked",
    },
    {
      key: "reservations",
      icon: <CalendarDays size={16} color={iconColor} strokeWidth={1.8} />,
      value: reservedTodayCount === null ? "—" : String(reservedTodayCount),
      label: "Reserved today",
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
              >
                {m.value}
              </Text>
              <Text
                className="text-light-muted dark:text-dark-muted font-book text-xs mt-0.5"
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
