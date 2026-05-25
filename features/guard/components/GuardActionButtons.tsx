import { SectionHeader } from "@/components/shared";
import { Keyboard } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface GuardActionButtonsProps {
  onSearch?: () => void;
}

export default function GuardActionButtons({
  onSearch,
}: GuardActionButtonsProps) {
  return (
    <View className="mt-6 px-1">
      <SectionHeader title="Fallback Actions" containerClassName="mb-3" />
      <TouchableOpacity
        onPress={onSearch}
        activeOpacity={0.7}
        className="w-full bg-light-surface rounded-card p-4 flex-row items-center shadow-soft border border-light-border/40"
      >
        <View className="w-11 h-11 rounded-button bg-light-background items-center justify-center mr-4">
          <Keyboard size={22} color="#334155" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-light-text font-heavy text-[15px] leading-5">
            Manual Input Entry
          </Text>
          <Text
            className="text-light-muted font-regular text-[12px] mt-0.5 leading-5"
            numberOfLines={1}
          >
            Process entry via vehicle plate number
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
