import { Clock } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import AppButton from "@/components/ui/AppButton";

interface ActiveSessionBannerProps {
  parkedCount: number;
  onPress: () => void;
}

export default function ActiveSessionBanner({
  parkedCount,
  onPress,
}: ActiveSessionBannerProps) {
  const { colors } = useAppTheme();
  const sentence =
    parkedCount === 1
      ? "You have 1 vehicle currently parked."
      : `You have ${parkedCount} vehicles currently parked.`;

  return (
    <View className="mb-4 flex-row items-center justify-between bg-light-warning/10 dark:bg-dark-warning/25 border border-light-warning/30 dark:border-dark-warning/40 px-4 py-3.5 rounded-2xl shadow-sm">
      <View className="flex-row items-center flex-1 pr-2 gap-3">
        <View className="w-8 h-8 rounded-full bg-light-warning/10 dark:bg-dark-warning/35 items-center justify-center">
          <Clock size={16} color={colors.warning} strokeWidth={2.5} />
        </View>
        <View className="flex-1">
          <Text className="text-light-text dark:text-dark-warning font-bold text-xs uppercase tracking-wider">
            Active Parking Session
          </Text>
          <Text className="text-light-text dark:text-dark-warning font-medium text-[11px] mt-0.5">
            {sentence}
          </Text>
        </View>
      </View>
      <AppButton
        label="View Live"
        size="sm"
        uppercase={false}
        onPress={onPress}
      />
    </View>
  );
}
