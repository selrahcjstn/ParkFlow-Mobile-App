import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badgeCount?: number;
  onPress?: () => void;
  className?: string;
  iconContainerClassName?: string;
}

export default function QuickActionCard({
  icon,
  title,
  subtitle,
  badgeCount,
  onPress,
  className = "",
  iconContainerClassName = "bg-light-primary/10 dark:bg-dark-primary/22",
}: QuickActionCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`w-full bg-light-surface dark:bg-dark-surface rounded-card p-4 ${className}`}
    >
      <View className="flex-row items-start justify-between mb-5">
        <View
          className={`w-11 h-11 rounded-button items-center justify-center ${iconContainerClassName}`}
        >
          {icon}
        </View>
        {badgeCount !== undefined && badgeCount > 0 ? (
          <View className="bg-light-primary dark:bg-dark-primary rounded-pill min-w-[20px] h-5 px-1.5 items-center justify-center">
            <Text className="font-bold text-[10px] text-white dark:text-zinc-950">
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </View>
        ) : null}
      </View>

      <View>
        <Text
          className="text-light-text dark:text-dark-text font-bold leading-tight text-[15px]"
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
