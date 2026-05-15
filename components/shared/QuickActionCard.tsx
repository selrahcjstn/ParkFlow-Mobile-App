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
      className="flex-1 bg-light-surface border border-light-border rounded-2xl px-4 py-4 flex-row items-center gap-x-3"
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View className="relative">
        <View className="w-10 h-10 rounded-xl overflow-hidden bg-light-background border border-light-border items-center justify-center">
          {icon}
        </View>

        {badgeCount !== undefined && badgeCount > 0 ? (
          <View className="absolute -top-1.5 -right-1.5 bg-light-danger rounded-full w-5 h-5 items-center justify-center">
            <Caption className="text-white font-heavy">{badgeCount}</Caption>
          </View>
        ) : null}
      </View>

      <View className="gap-y-0.5">
        <Body className="font-black">{title}</Body>
        {subtitle ? <Caption>{subtitle}</Caption> : null}
      </View>
    </TouchableOpacity>
  );
}
