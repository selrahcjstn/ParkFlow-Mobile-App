import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  /** Lucide icon or any ReactNode rendered as the leading visual */
  icon: ReactNode;
  /** The big number / value */
  value: string | number;
  /** Short description label */
  label: string;
  /** Optional sub-label (e.g. "+8% from last month") */
  sublabel?: string;
  /** Colour class for the sublabel text (e.g. "text-light-success") */
  sublabelColor?: string;
}

/**
 * A stat / metric card used on the dashboard to highlight a single KPI.
 * Renders an icon on the left with the value, label, and optional trend text on the right.
 */
export default function StatCard({
  icon,
  value,
  label,
  sublabel,
  sublabelColor = "text-light-success",
}: StatCardProps) {
  return (
    <View className="flex-row items-center bg-light-surface rounded-2xl px-5 py-4 mx-5 shadow-sm border border-light-border">
      {/* Icon */}
      <View className="mr-4">{icon}</View>

      {/* Text block */}
      <View className="flex-1">
        <Text className="text-light-text text-3xl font-extrabold">{value}</Text>
        <Text className="text-light-muted text-xs font-semibold mt-0.5">
          {label}
        </Text>
        {sublabel && (
          <Text className={`${sublabelColor} text-xs font-bold mt-0.5`}>
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}
