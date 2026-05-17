import { Body, Caption } from "@/components/ui/Typography";
import type { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";

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
        borderWidth: 0.5,
        borderColor: "rgba(0,0,0,0.08)",
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
        {/* Icon container */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#F7F7F5",
            borderWidth: 0.5,
            borderColor: "rgba(0,0,0,0.06)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>

        {/* Badge — top right corner */}
        {badgeCount !== undefined && badgeCount > 0 ? (
          <View
            style={{
              backgroundColor: "#E24B4A",
              borderRadius: 999,
              minWidth: 20,
              height: 20,
              paddingHorizontal: 5,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Caption style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>
              {badgeCount > 99 ? "99+" : badgeCount}
            </Caption>
          </View>
        ) : null}
      </View>

      {/* ── Text section ── */}
      <View>
        <Body
          className="text-light-text font-black leading-tight"
          style={{ fontSize: 15 }}
          numberOfLines={2}
        >
          {title}
        </Body>

        {subtitle ? (
          <Body
            className="text-light-muted font-heavy uppercase tracking-widest"
            style={{ fontSize: 9, marginTop: 4 }}
            numberOfLines={1}
          >
            {subtitle}
          </Body>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
