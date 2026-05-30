import { SectionHeader } from "@/components/shared";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Keyboard } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface GuardActionButtonsProps {
  onSearch?: () => void;
}

export default function GuardActionButtons({
  onSearch,
}: GuardActionButtonsProps) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-6">
      <SectionHeader title="Fallback Actions" containerClassName="mb-3" />
      <TouchableOpacity
        onPress={onSearch}
        activeOpacity={0.7}
        className="w-full bg-light-surface dark:bg-dark-surface rounded-card p-4 flex-row items-center shadow-soft border border-light-border dark:border-dark-border"
      >
        <View className="w-11 h-11 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center mr-4">
          <Keyboard size={22} color={colors.accent} strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-light-text dark:text-dark-text font-black text-[15px] leading-5">
            Manual Input Entry
          </Text>
          <Text
            className="text-light-muted dark:text-dark-muted font-book text-[12px] mt-1 leading-4"
            numberOfLines={1}
          >
            Process entry via vehicle plate number
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
