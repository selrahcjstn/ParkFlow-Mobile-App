import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badgeCount?: number;
  onPress?: () => void;
}

export default function QuickActionCard({
  icon,
  title,
  subtitle,
  badgeCount,
  onPress,
}: QuickActionCardProps) {
  return (
    <TouchableOpacity
      className="flex-1 bg-light-surface border border-light-border rounded-2xl px-4 py-4 flex-row items-center gap-x-3"
      activeOpacity={0.75}
      onPress={onPress}
    >
      {/* Icon with optional badge */}
      <View className="relative">
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#F8F9FA",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          className="items-center justify-center"
        >
          {icon}
        </View>

        {badgeCount !== undefined && badgeCount > 0 && (
          <View className="absolute -top-1.5 -right-1.5 bg-light-danger rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-[10px] font-heavy">
              {badgeCount}
            </Text>
          </View>
        )}
      </View>

      {/* Title + Subtitle */}
      <View className="gap-y-0.5">
        <Text className="text-light-text font-black">{title}</Text>
        {subtitle && (
          <Text className="text-light-muted text-xs font-book">{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
