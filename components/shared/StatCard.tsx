// StatCard.tsx
import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  sublabel?: string;
  sublabelColor?: string;
}

export default function StatCard({
  icon,
  value,
  label,
  sublabel,
  sublabelColor = "text-light-success",
}: StatCardProps) {
  return (
    <View className="mx-5 bg-light-surface rounded-2xl border border-light-border shadow-sm px-5 py-4 flex-row items-center gap-x-4">
      {/* Icon well */}
      <View className="w-12 h-12 rounded-xl bg-light-background border border-light-border items-center justify-center">
        {icon}
      </View>

      {/* Values */}
      <View className="flex-1">
        <Text className="text-light-text text-3xl font-extrabold tracking-tight leading-tight">
          {value}
        </Text>
        <Text className="text-light-muted text-[11px] font-semibold uppercase tracking-widest mt-0.5">
          {label}
        </Text>
      </View>

      {/* Sublabel pill */}
      {sublabel && (
        <View className="bg-light-success/10 border border-light-success/20 px-2.5 py-1 rounded-full">
          <Text className={`${sublabelColor} text-[10px] font-bold`}>
            {sublabel}
          </Text>
        </View>
      )}
    </View>
  );
}
