import { SectionHeader } from "@/components/shared";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Keyboard, LogOut } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface GuardActionButtonsProps {
  onSearch?: () => void;
  onExit?: () => void;
}

export default function GuardActionButtons({
  onSearch,
  onExit,
}: GuardActionButtonsProps) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-6 gap-3">
      <SectionHeader title="Fallback Actions" containerClassName="mb-1" />
      
      {/* Manual Entry Button */}
      <TouchableOpacity
        onPress={onSearch}
        activeOpacity={0.7}
        className="w-full bg-light-surface dark:bg-dark-surface rounded-card p-4 flex-row items-center shadow-soft border border-light-border dark:border-dark-border"
      >
        <View className="w-11 h-11 rounded-button bg-amber-50 dark:bg-amber-500/25 items-center justify-center mr-4">
          <Keyboard size={22} color={colors.warning} strokeWidth={2.2} />
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

      {/* Manual Exit Button */}
      <TouchableOpacity
        onPress={onExit}
        activeOpacity={0.7}
        className="w-full bg-light-surface dark:bg-dark-surface rounded-card p-4 flex-row items-center shadow-soft border border-light-border dark:border-dark-border"
      >
        <View className="w-11 h-11 rounded-button bg-red-50 dark:bg-red-500/20 items-center justify-center mr-4">
          <LogOut size={22} color={colors.danger} strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-light-text dark:text-dark-text font-black text-[15px] leading-5">
            Manual Input Exit
          </Text>
          <Text
            className="text-light-muted dark:text-dark-muted font-book text-[12px] mt-1 leading-4"
            numberOfLines={1}
          >
            Process exit via vehicle plate number
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
