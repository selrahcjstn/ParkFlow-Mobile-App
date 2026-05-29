import { Clock } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ActiveSessionBannerProps {
  parkedCount: number;
  onPress: () => void;
}

export default function ActiveSessionBanner({
  parkedCount,
  onPress,
}: ActiveSessionBannerProps) {
  const sentence =
    parkedCount === 1
      ? "You have 1 vehicle currently parked."
      : `You have ${parkedCount} vehicles currently parked.`;

  return (
    <View className="mb-4 flex-row items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-4 py-3.5 rounded-2xl shadow-sm">
      <View className="flex-row items-center flex-1 pr-2 gap-3">
        <View className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center">
          <Clock size={16} color="#D97706" strokeWidth={2.5} />
        </View>
        <View className="flex-1">
          <Text className="text-amber-800 dark:text-amber-300 font-heavy text-xs uppercase tracking-wider">
            Active Parking Session
          </Text>
          <Text className="text-amber-700 dark:text-amber-400 font-medium text-[11px] mt-0.5">
            {sentence}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="bg-amber-600 dark:bg-amber-700 px-3.5 py-1.5 rounded-full"
      >
        <Text className="text-white font-heavy text-[10px] uppercase tracking-wider">
          View Live
        </Text>
      </TouchableOpacity>
    </View>
  );
}
