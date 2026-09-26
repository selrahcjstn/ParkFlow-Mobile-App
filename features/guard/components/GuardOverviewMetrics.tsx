import { useAppTheme } from "@/hooks/useAppTheme";
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
  const { colors } = useAppTheme();
  const {
    totalParked = 0,
    totalSlots = 100,
    manualEntriesCount = 0,
    overstayCount = 0,
  } = data;
  const occupancyPercent =
    totalSlots > 0 ? Math.round((totalParked / totalSlots) * 100) : 0;

  const metrics = [
    {
      value: `${totalParked}/${totalSlots}`,
      label: "Occupancy",
      accent: `${occupancyPercent}%`,
      accentColor: occupancyPercent > 80 ? colors.danger : colors.primary,
    },
    {
      value: String(manualEntriesCount),
      label: "Manual Input",
    },
    {
      value: String(overstayCount),
      label: "Overstaying",
      accentColor: overstayCount > 0 ? colors.warning : undefined,
    },
  ];

  return (
    <View className="mt-5">
      <View className="flex-row gap-2.5">
        {metrics.map((m, i) => (
          <View
            key={i}
            className="flex-1 bg-light-surface dark:bg-dark-surface rounded-card p-3.5 border border-light-border dark:border-dark-border"
          >
            <Text
              className="text-light-text dark:text-dark-text font-bold text-[20px] leading-6"
              style={m.accentColor && m.value !== `${totalParked}/${totalSlots}` ? { color: m.accentColor } : undefined}
            >
              {m.value}
            </Text>
            {m.accent && (
              <Text
                className="font-bold text-[11px] mt-0.5"
                style={{ color: m.accentColor }}
              >
                {m.accent}
              </Text>
            )}
            <Text className="text-light-muted dark:text-dark-muted text-[11px] mt-1.5 tracking-wide">
              {m.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
