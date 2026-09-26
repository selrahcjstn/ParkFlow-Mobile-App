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
    <View
      className="mx-5 mt-2 mb-2 bg-light-surface dark:bg-dark-surface rounded-[24px] overflow-hidden border border-light-border/50 dark:border-dark-border/40"
    >
      {/* Red accent bar at the top */}
      <View className="flex-row h-1">
        <View className="flex-1 bg-light-primary" />
        <View style={{ width: 48, backgroundColor: "#FDB813" }} />
      </View>

      <View className="px-5 py-5 flex-row items-center justify-between">
        {/* ── Left: Icon + Stat ── */}
        <View className="flex-row items-center flex-1 pr-2">
          {/* Icon container with gold tint */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "#FDB81315",
              borderWidth: 0.5,
              borderColor: "#FDB81340",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            {icon}
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-light-muted dark:text-dark-muted font-bold uppercase tracking-widest mb-0.5 text-[10px]">
              {label}
            </Text>
            <Text className="text-light-text dark:text-dark-text font-black tracking-tight text-[32px] leading-[36px]">
              {value}
            </Text>
          </View>
        </View>

        {/* ── Right: Sub-badge ── */}
        {sublabel ? (
          <View
            style={{
              backgroundColor: "#D2273010",
              borderWidth: 0.5,
              borderColor: "#D2273030",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "45%",
            }}
          >
            <Text
              className={`${sublabelColor} font-bold text-center text-[11px] leading-[14px]`}
              numberOfLines={2}
            >
              {sublabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

