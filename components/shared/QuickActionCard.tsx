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
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        width: "100%",
      }}
    >
      {/* ── Top row: icon left, badge right ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        {/* Icon container — borderless, flat bg */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#F4F4F5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>

        {/* Badge */}
        {badgeCount !== undefined && badgeCount > 0 ? (
          <View
            style={{
              backgroundColor: "#D22730",
              borderRadius: 999,
              minWidth: 20,
              height: 20,
              paddingHorizontal: 5,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="font-bold text-[10px] text-white">
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Text section ── */}
      <View>
        <Text
          className="text-light-text font-black leading-tight text-[15px]"
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-light-muted font-bold uppercase tracking-widest text-[9px] mt-1"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
