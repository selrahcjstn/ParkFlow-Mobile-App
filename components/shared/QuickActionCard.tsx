import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface QuickActionCardProps {
  /** Lucide icon or any ReactNode */
  icon: ReactNode;
  /** Card title */
  title: string;
  /** Small subtitle text below the title */
  subtitle?: string;
  /** Optional badge count rendered as a red dot with number */
  badgeCount?: number;
  /** Callback when the card is pressed */
  onPress?: () => void;
}

/**
 * A tappable card used for quick-action shortcuts (Penalty, Request Reservation, etc.).
 * Displays an icon, title, subtitle, and an optional notification badge.
 */
export default function QuickActionCard({
  icon,
  title,
  subtitle,
  badgeCount,
  onPress,
}: QuickActionCardProps) {
  return (
    <TouchableOpacity
      className="flex-1 bg-light-surface rounded-2xl px-4 py-5 items-center shadow-sm border border-light-border"
      activeOpacity={0.75}
      onPress={onPress}
    >
      {/* Icon with optional badge */}
      <View className="relative mb-2">
        {icon}
        {badgeCount !== undefined && badgeCount > 0 && (
          <View className="absolute -top-1.5 -right-2.5 bg-light-danger rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {badgeCount}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text className="text-light-text text-sm font-bold text-center">
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text className="text-light-muted text-[11px] font-medium text-center mt-0.5">
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
}
