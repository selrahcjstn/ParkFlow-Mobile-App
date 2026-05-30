import { useAppTheme } from "@/hooks/useAppTheme";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AccountMenuRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  isDanger?: boolean;
  rightElement?: React.ReactNode;
}

export default function AccountMenuRow({
  icon,
  label,
  onPress,
  isLast = false,
  isDanger = false,
  rightElement,
}: AccountMenuRowProps) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between py-4 px-4 relative"
    >
      <View className="flex-row items-center gap-3.5 flex-1 pr-3">
        <View
          className={`w-9 h-9 rounded-button items-center justify-center ${
            isDanger
              ? "bg-light-primary/10 dark:bg-dark-primary/10"
              : "bg-light-surfaceLighter dark:bg-dark-surfaceLighter"
          }`}
        >
          {icon}
        </View>
        <Text
          className={`text-[15px] ${
            isDanger
              ? "font-heavy text-light-primary dark:text-dark-primary"
              : "font-regular text-light-text dark:text-dark-text"
          }`}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>

      {rightElement !== undefined ? (
        rightElement
      ) : onPress ? (
        <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
      ) : null}

      {!isLast && (
        <View className="absolute bottom-0 left-4 right-4 h-px bg-light-border dark:bg-dark-border" />
      )}
    </TouchableOpacity>
  );
}
